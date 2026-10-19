// apps/backend/src/services/communication/CampaignService.ts
import mongoose from 'mongoose';
import { Campaign, ICampaign, CampaignStatus } from '../../db/models/Campaign';
import { CampaignRecipient, ICampaignRecipient, RecipientStatus } from '../../db/models/CampaignRecipient';
import { CommunicationTemplate, ICommunicationTemplate } from '../../db/models/CommunicationTemplate';
import { SavedAudience, ISavedAudience } from '../../db/models/SavedAudience';
import { AudienceFilterEngine, IAudienceFilter } from './AudienceFilterEngine';
import { TemplateVariableRegistry } from './TemplateVariableRegistry';
import { ProviderRegistry } from './providers/ProviderRegistry';
import { QueueManager } from '../../queues/QueueManager';
import { logger } from '../../utils/logger';

export class CampaignService {
  /**
   * List campaigns with filtering, search, and pagination
   */
  public static async listCampaigns(query: {
    channel?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { channel, status, search, page = 1, limit = 20 } = query;
    const filter: Record<string, any> = {};

    if (channel && channel !== 'all') {
      filter.channel = channel;
    }
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (search && search.trim()) {
      filter.name = { $regex: search.trim(), $options: 'i' };
    }

    const skip = (Math.max(1, page) - 1) * limit;

    const [campaigns, total] = await Promise.all([
      Campaign.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('templateId', 'name slug subject whatsappTemplateName')
        .lean(),
      Campaign.countDocuments(filter),
    ]);

    return {
      campaigns,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get single campaign by ID
   */
  public static async getCampaignById(id: string): Promise<ICampaign | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Campaign.findById(id).populate('templateId').lean() as any;
  }

  /**
   * Create a new campaign in DRAFT status
   */
  public static async createCampaign(data: Partial<ICampaign>, user = 'Admin'): Promise<ICampaign> {
    let templateSnapshot = data.templateSnapshot;

    // Snapshot template details if templateId is provided
    if (data.templateId && !templateSnapshot) {
      const tpl = await CommunicationTemplate.findById(data.templateId).lean();
      if (tpl) {
        templateSnapshot = {
          subject: tpl.subject,
          preheader: tpl.preheader,
          contentHtml: tpl.contentHtml,
          contentText: tpl.contentText,
          whatsappTemplateName: tpl.whatsappTemplateName,
          whatsappLanguageCode: tpl.whatsappLanguageCode,
          whatsappComponents: tpl.whatsappComponents,
          variables: tpl.variables,
        };
      }
    }

    const campaign = new Campaign({
      name: data.name,
      description: data.description || '',
      channel: data.channel,
      type: data.type || 'marketing',
      status: 'draft',
      templateId: data.templateId,
      templateSnapshot,
      audienceFilter: data.audienceFilter || {},
      scheduledAt: data.scheduledAt || null,
      rateLimitPerSecond: data.rateLimitPerSecond || 20,
      provider: data.provider || 'default',
      createdBy: user,
      auditLog: [
        {
          action: 'CAMPAIGN_CREATED',
          performedBy: user,
          timestamp: new Date(),
          details: `Campaign initialized with channel: ${data.channel}`,
          newStatus: 'draft',
        },
      ],
    });

    await campaign.save();
    logger.info(`📢 [CampaignService] Campaign "${campaign.name}" (${campaign._id}) created by ${user}`);
    return campaign;
  }

  /**
   * Update campaign settings (allowed before queueing)
   */
  public static async updateCampaign(
    id: string,
    updates: Partial<ICampaign>,
    user = 'Admin'
  ): Promise<ICampaign> {
    const campaign = await Campaign.findById(id);
    if (!campaign) throw new Error('Campaign not found');

    const editableStatuses: CampaignStatus[] = ['draft', 'audience_selected', 'ready', 'scheduled'];
    if (!editableStatuses.includes(campaign.status)) {
      throw new Error(`Campaign cannot be edited in current status: "${campaign.status}"`);
    }

    // Refresh template snapshot if templateId changed
    if (updates.templateId && String(updates.templateId) !== String(campaign.templateId)) {
      const tpl = await CommunicationTemplate.findById(updates.templateId).lean();
      if (tpl) {
        updates.templateSnapshot = {
          subject: tpl.subject,
          preheader: tpl.preheader,
          contentHtml: tpl.contentHtml,
          contentText: tpl.contentText,
          whatsappTemplateName: tpl.whatsappTemplateName,
          whatsappLanguageCode: tpl.whatsappLanguageCode,
          whatsappComponents: tpl.whatsappComponents,
          variables: tpl.variables,
        };
      }
    }

    Object.assign(campaign, updates);
    campaign.auditLog.push({
      action: 'CAMPAIGN_UPDATED',
      performedBy: user,
      timestamp: new Date(),
      details: 'Campaign settings and audience filter updated',
      previousStatus: campaign.status,
      newStatus: campaign.status,
    });

    await campaign.save();
    return campaign;
  }

  /**
   * Recalculate audience estimation and store snapshot
   */
  public static async calculateAudience(id: string, user = 'Admin') {
    const campaign = await Campaign.findById(id);
    if (!campaign) throw new Error('Campaign not found');

    const estimate = await AudienceFilterEngine.estimateAudience(
      campaign.audienceFilter as IAudienceFilter,
      campaign.channel
    );

    campaign.audienceSnapshot = {
      totalMatched: estimate.totalMatched,
      totalEligible: estimate.eligible,
      excludedCount: estimate.suppressed + estimate.missingContact + estimate.optedOut,
      exclusionBreakdown: estimate.exclusionBreakdown,
      snapshotTakenAt: new Date(),
    };

    campaign.stats.totalRecipients = estimate.totalMatched;
    campaign.stats.eligible = estimate.eligible;
    campaign.stats.suppressed = estimate.suppressed;

    if (campaign.status === 'draft') {
      campaign.status = 'audience_selected';
    }

    campaign.auditLog.push({
      action: 'AUDIENCE_CALCULATED',
      performedBy: user,
      timestamp: new Date(),
      details: `Audience calculated: ${estimate.eligible} eligible out of ${estimate.totalMatched} matched`,
      newStatus: campaign.status,
    });

    await campaign.save();
    return { campaign, estimate };
  }

  /**
   * Preview sample recipients with resolved variables
   */
  public static async previewRecipients(id: string, limit = 10) {
    const campaign = await Campaign.findById(id);
    if (!campaign) throw new Error('Campaign not found');

    return AudienceFilterEngine.previewAudience(
      campaign.audienceFilter as IAudienceFilter,
      campaign.channel,
      limit
    );
  }

  /**
   * Schedule campaign for future dispatch
   */
  public static async scheduleCampaign(id: string, scheduledAt: Date, user = 'Admin'): Promise<ICampaign> {
    const campaign = await Campaign.findById(id);
    if (!campaign) throw new Error('Campaign not found');

    const targetDate = new Date(scheduledAt);
    if (isNaN(targetDate.getTime()) || targetDate.getTime() <= Date.now()) {
      throw new Error('Scheduled date must be a valid future timestamp');
    }

    const previousStatus = campaign.status;
    campaign.status = 'scheduled';
    campaign.scheduledAt = targetDate;
    campaign.auditLog.push({
      action: 'CAMPAIGN_SCHEDULED',
      performedBy: user,
      timestamp: new Date(),
      details: `Scheduled for dispatch at ${targetDate.toISOString()}`,
      previousStatus,
      newStatus: 'scheduled',
    });

    await campaign.save();
    return campaign;
  }

  /**
   * Launch campaign immediately via background queue
   */
  public static async launchCampaign(id: string, user = 'Admin'): Promise<ICampaign> {
    const campaign = await Campaign.findById(id);
    if (!campaign) throw new Error('Campaign not found');

    const launchableStatuses: CampaignStatus[] = ['draft', 'audience_selected', 'ready', 'scheduled'];
    if (!launchableStatuses.includes(campaign.status)) {
      throw new Error(`Cannot launch campaign with status: "${campaign.status}"`);
    }

    // Verify template content
    if (!campaign.templateSnapshot) {
      if (campaign.templateId) {
        const tpl = await CommunicationTemplate.findById(campaign.templateId).lean();
        if (tpl) {
          campaign.templateSnapshot = {
            subject: tpl.subject,
            preheader: tpl.preheader,
            contentHtml: tpl.contentHtml,
            contentText: tpl.contentText,
            whatsappTemplateName: tpl.whatsappTemplateName,
            whatsappLanguageCode: tpl.whatsappLanguageCode,
            whatsappComponents: tpl.whatsappComponents,
            variables: tpl.variables,
          };
        }
      }
      if (!campaign.templateSnapshot) {
        throw new Error('Campaign template snapshot is required before launch');
      }
    }

    const previousStatus = campaign.status;
    campaign.status = 'queued';
    campaign.startedAt = new Date();
    campaign.auditLog.push({
      action: 'CAMPAIGN_LAUNCHED',
      performedBy: user,
      timestamp: new Date(),
      details: 'Campaign enqueued to background dispatch worker',
      previousStatus,
      newStatus: 'queued',
    });

    await campaign.save();

    // Enqueue dispatch job
    const dispatchQueue = QueueManager.getOrCreateQueue('campaignDispatchQueue');
    await dispatchQueue.add('dispatch-campaign', { campaignId: String(campaign._id) });

    logger.info(`🚀 [CampaignService] Campaign "${campaign.name}" launched and enqueued`);
    return campaign;
  }

  /**
   * Pause a running or queued campaign
   */
  public static async pauseCampaign(id: string, user = 'Admin'): Promise<ICampaign> {
    const campaign = await Campaign.findById(id);
    if (!campaign) throw new Error('Campaign not found');

    if (campaign.status !== 'running' && campaign.status !== 'queued') {
      throw new Error(`Only running or queued campaigns can be paused (current: ${campaign.status})`);
    }

    const previousStatus = campaign.status;
    campaign.status = 'paused';
    campaign.pausedAt = new Date();
    campaign.auditLog.push({
      action: 'CAMPAIGN_PAUSED',
      performedBy: user,
      timestamp: new Date(),
      details: 'Campaign execution paused by admin',
      previousStatus,
      newStatus: 'paused',
    });

    await campaign.save();
    logger.warn(`⏸️ [CampaignService] Campaign "${campaign.name}" paused by ${user}`);
    return campaign;
  }

  /**
   * Resume a paused campaign
   */
  public static async resumeCampaign(id: string, user = 'Admin'): Promise<ICampaign> {
    const campaign = await Campaign.findById(id);
    if (!campaign) throw new Error('Campaign not found');

    if (campaign.status !== 'paused') {
      throw new Error(`Only paused campaigns can be resumed (current: ${campaign.status})`);
    }

    const previousStatus = campaign.status;
    campaign.status = 'running';
    campaign.pausedAt = null;
    campaign.auditLog.push({
      action: 'CAMPAIGN_RESUMED',
      performedBy: user,
      timestamp: new Date(),
      details: 'Campaign resumed by admin',
      previousStatus,
      newStatus: 'running',
    });

    await campaign.save();

    // Re-enqueue pending recipients in batches
    const pendingCount = await CampaignRecipient.countDocuments({
      campaignId: campaign._id,
      status: 'pending',
    });

    if (pendingCount > 0) {
      const recipientQueue = QueueManager.getOrCreateQueue('campaignRecipientQueue');
      const pendingIds = await CampaignRecipient.find({ campaignId: campaign._id, status: 'pending' })
        .select('_id')
        .lean();

      const batchSize = 50;
      for (let i = 0; i < pendingIds.length; i += batchSize) {
        const batch = pendingIds.slice(i, i + batchSize).map(r => String(r._id));
        await recipientQueue.add('send-batch', { campaignId: String(campaign._id), recipientIds: batch });
      }
    }

    logger.info(`▶️ [CampaignService] Campaign "${campaign.name}" resumed by ${user}`);
    return campaign;
  }

  /**
   * Cancel an ongoing campaign and invalidate remaining pending recipients
   */
  public static async cancelCampaign(id: string, user = 'Admin'): Promise<ICampaign> {
    const campaign = await Campaign.findById(id);
    if (!campaign) throw new Error('Campaign not found');

    const cancelableStatuses: CampaignStatus[] = ['draft', 'audience_selected', 'ready', 'scheduled', 'queued', 'running', 'paused'];
    if (!cancelableStatuses.includes(campaign.status)) {
      throw new Error(`Campaign cannot be cancelled in status: "${campaign.status}"`);
    }

    const previousStatus = campaign.status;
    campaign.status = 'cancelled';
    campaign.cancelledAt = new Date();
    campaign.auditLog.push({
      action: 'CAMPAIGN_CANCELLED',
      performedBy: user,
      timestamp: new Date(),
      details: 'Campaign cancelled by admin. Pending messages marked as cancelled.',
      previousStatus,
      newStatus: 'cancelled',
    });

    await campaign.save();

    // Bulk mark remaining pending recipients as cancelled
    const updateResult = await CampaignRecipient.updateMany(
      { campaignId: campaign._id, status: { $in: ['pending', 'processing'] } },
      { $set: { status: 'cancelled' } }
    );

    campaign.stats.cancelled = updateResult.modifiedCount;
    await campaign.save();

    logger.info(`🛑 [CampaignService] Campaign "${campaign.name}" cancelled (${updateResult.modifiedCount} recipients cancelled)`);
    return campaign;
  }

  /**
   * Retry failed retryable recipients
   */
  public static async retryFailedRecipients(id: string, user = 'Admin') {
    const campaign = await Campaign.findById(id);
    if (!campaign) throw new Error('Campaign not found');

    const failedRecipients = await CampaignRecipient.find({
      campaignId: campaign._id,
      status: { $in: ['failed_retryable', 'failed_permanent'] },
    })
      .select('_id')
      .lean();

    if (failedRecipients.length === 0) {
      return { retriedCount: 0, message: 'No failed recipients found to retry' };
    }

    const ids = failedRecipients.map(r => r._id);
    await CampaignRecipient.updateMany(
      { _id: { $in: ids } },
      {
        $set: {
          status: 'pending',
          attempts: 0,
          failedReason: undefined,
          failureCategory: undefined,
        },
      }
    );

    if (campaign.status === 'completed' || campaign.status === 'failed') {
      campaign.status = 'running';
    }

    campaign.auditLog.push({
      action: 'RETRY_FAILED_RECIPIENTS',
      performedBy: user,
      timestamp: new Date(),
      details: `Retried ${ids.length} failed recipients`,
      newStatus: campaign.status,
    });

    await campaign.save();

    // Enqueue recipient queue batches
    const recipientQueue = QueueManager.getOrCreateQueue('campaignRecipientQueue');
    const batchSize = 50;
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize).map(r => String(r));
      await recipientQueue.add('send-batch', { campaignId: String(campaign._id), recipientIds: batch });
    }

    return { retriedCount: ids.length, message: `Successfully enqueued ${ids.length} recipients for retry` };
  }

  /**
   * Send test email or WhatsApp message to an admin/test address
   */
  public static async testSend(params: {
    channel: 'email' | 'whatsapp';
    recipient: string;
    templateId?: string;
    customContent?: {
      subject?: string;
      contentHtml?: string;
      whatsappTemplateName?: string;
    };
    variables?: Record<string, string>;
  }) {
    const { channel, recipient, templateId, customContent, variables = {} } = params;

    let subject = customContent?.subject || 'Test Message';
    let contentHtml = customContent?.contentHtml || '<p>This is a test message from PerfectPic Campaign Engine.</p>';
    let whatsappTemplateName = customContent?.whatsappTemplateName;

    if (templateId) {
      const tpl = await CommunicationTemplate.findById(templateId).lean();
      if (tpl) {
        if (tpl.subject) subject = tpl.subject;
        if (tpl.contentHtml) contentHtml = tpl.contentHtml;
        if (tpl.whatsappTemplateName) whatsappTemplateName = tpl.whatsappTemplateName;
      }
    }

    // Prepare default test variable fixtures
    const defaultSample = TemplateVariableRegistry.generateSampleData([
      'first_name',
      'last_name',
      'full_name',
      'order_number',
      'order_total',
      'tracking_url',
      'discount_code',
    ]);
    const mergedVars = { ...defaultSample, ...variables };

    const interpolatedSubject = TemplateVariableRegistry.interpolate(subject, mergedVars);
    const interpolatedHtml = TemplateVariableRegistry.interpolate(contentHtml, mergedVars);

    if (channel === 'email') {
      const provider = ProviderRegistry.getEmailProvider();
      return provider.send({
        to: recipient,
        subject: `[TEST] ${interpolatedSubject}`,
        html: interpolatedHtml,
      });
    } else {
      const provider = ProviderRegistry.getWhatsappProvider();
      return provider.send({
        to: recipient,
        templateName: whatsappTemplateName,
        freeformText: `[TEST] ${interpolatedSubject}\n\n${interpolatedHtml.replace(/<[^>]*>?/gm, '')}`,
      });
    }
  }

  /**
   * Clone an existing campaign into a fresh DRAFT
   */
  public static async duplicateCampaign(id: string, user = 'Admin'): Promise<ICampaign> {
    const original = await Campaign.findById(id).lean();
    if (!original) throw new Error('Campaign not found');

    const duplicate = new Campaign({
      name: `${original.name} (Copy)`,
      description: original.description,
      channel: original.channel,
      type: original.type,
      status: 'draft',
      templateId: original.templateId,
      templateSnapshot: original.templateSnapshot,
      audienceFilter: original.audienceFilter,
      rateLimitPerSecond: original.rateLimitPerSecond,
      provider: original.provider,
      createdBy: user,
      auditLog: [
        {
          action: 'CAMPAIGN_DUPLICATED',
          performedBy: user,
          timestamp: new Date(),
          details: `Duplicated from campaign: "${original.name}" (${original._id})`,
          newStatus: 'draft',
        },
      ],
    });

    await duplicate.save();
    return duplicate;
  }

  /**
   * Query campaign recipients with status filter and pagination
   */
  public static async getCampaignRecipients(
    campaignId: string,
    query: {
      status?: string;
      search?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const { status, search, page = 1, limit = 50 } = query;
    const filter: Record<string, any> = { campaignId: new mongoose.Types.ObjectId(campaignId) };

    if (status && status !== 'all') {
      filter.status = status;
    }
    if (search && search.trim()) {
      filter.$or = [
        { email: { $regex: search.trim(), $options: 'i' } },
        { phone: { $regex: search.trim(), $options: 'i' } },
        { customerName: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const skip = (Math.max(1, page) - 1) * limit;

    const [recipients, total] = await Promise.all([
      CampaignRecipient.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CampaignRecipient.countDocuments(filter),
    ]);

    return {
      recipients,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Detailed performance analytics and funnel
   */
  public static async getCampaignAnalytics(id: string) {
    const campaign = await Campaign.findById(id).lean();
    if (!campaign) throw new Error('Campaign not found');

    const [statusAgg, failureAgg] = await Promise.all([
      CampaignRecipient.aggregate([
        { $match: { campaignId: new mongoose.Types.ObjectId(id) } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      CampaignRecipient.aggregate([
        {
          $match: {
            campaignId: new mongoose.Types.ObjectId(id),
            status: { $in: ['failed_retryable', 'failed_permanent', 'bounced'] },
          },
        },
        { $group: { _id: '$failureCategory', count: { $sum: 1 } } },
      ]),
    ]);

    const statusCounts = Object.fromEntries(statusAgg.map(s => [s._id, s.count]));
    const failureBreakdown = Object.fromEntries(failureAgg.map(f => [f._id || 'unknown', f.count]));

    const sent = statusCounts['sent'] || campaign.stats?.sent || 0;
    const delivered = statusCounts['delivered'] || campaign.stats?.delivered || 0;
    const read = statusCounts['read'] || campaign.stats?.read || 0;
    const clicked = statusCounts['clicked'] || campaign.stats?.clicked || 0;
    const failed = (statusCounts['failed_permanent'] || 0) + (statusCounts['failed_retryable'] || 0);

    const deliveryRate = sent > 0 ? Math.round((delivered / sent) * 100) : 0;
    const openRate = delivered > 0 ? Math.round((read / delivered) * 100) : 0;
    const clickRate = read > 0 ? Math.round((clicked / read) * 100) : 0;

    return {
      campaignId: id,
      name: campaign.name,
      channel: campaign.channel,
      status: campaign.status,
      stats: campaign.stats,
      funnel: {
        totalRecipients: campaign.stats?.totalRecipients || 0,
        eligible: campaign.stats?.eligible || 0,
        sent,
        delivered,
        read,
        clicked,
        failed,
      },
      rates: {
        deliveryRate: `${deliveryRate}%`,
        openRate: `${openRate}%`,
        clickRate: `${clickRate}%`,
      },
      failureBreakdown,
      statusCounts,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // TEMPLATES API
  // ─────────────────────────────────────────────────────────────

  public static async listTemplates(query: {
    channel?: string;
    category?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { channel, category, status, search, page = 1, limit = 20 } = query;
    const filter: Record<string, any> = {};

    if (channel && channel !== 'all') filter.channel = channel;
    if (category && category !== 'all') filter.category = category;
    if (status && status !== 'all') filter.status = status;
    if (search && search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { slug: { $regex: search.trim(), $options: 'i' } },
        { subject: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const skip = (Math.max(1, page) - 1) * limit;

    const [templates, total] = await Promise.all([
      CommunicationTemplate.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CommunicationTemplate.countDocuments(filter),
    ]);

    return {
      templates,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  public static async createTemplate(data: Partial<ICommunicationTemplate>, user = 'Admin') {
    // Automatically parse extracted variables from subject and content
    const extracted = new Set<string>();
    if (data.subject) {
      TemplateVariableRegistry.extractVariables(data.subject).forEach(v => extracted.add(v));
    }
    if (data.contentHtml) {
      TemplateVariableRegistry.extractVariables(data.contentHtml).forEach(v => extracted.add(v));
    }
    if (data.contentText) {
      TemplateVariableRegistry.extractVariables(data.contentText).forEach(v => extracted.add(v));
    }

    const slug =
      data.slug ||
      data.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') ||
      `template-${Date.now()}`;

    const tpl = new CommunicationTemplate({
      ...data,
      slug,
      variables: Array.from(extracted),
      sampleData: TemplateVariableRegistry.generateSampleData(Array.from(extracted)),
      createdBy: user,
    });

    await tpl.save();
    return tpl;
  }

  public static async updateTemplate(id: string, updates: Partial<ICommunicationTemplate>) {
    const tpl = await CommunicationTemplate.findById(id);
    if (!tpl) throw new Error('Template not found');

    const extracted = new Set<string>();
    const sub = updates.subject !== undefined ? updates.subject : tpl.subject;
    const html = updates.contentHtml !== undefined ? updates.contentHtml : tpl.contentHtml;
    const txt = updates.contentText !== undefined ? updates.contentText : tpl.contentText;

    if (sub) TemplateVariableRegistry.extractVariables(sub).forEach(v => extracted.add(v));
    if (html) TemplateVariableRegistry.extractVariables(html).forEach(v => extracted.add(v));
    if (txt) TemplateVariableRegistry.extractVariables(txt).forEach(v => extracted.add(v));

    updates.variables = Array.from(extracted);
    updates.sampleData = TemplateVariableRegistry.generateSampleData(Array.from(extracted));

    Object.assign(tpl, updates);
    tpl.version += 1;
    await tpl.save();
    return tpl;
  }

  public static async deleteTemplate(id: string) {
    return CommunicationTemplate.findByIdAndDelete(id);
  }

  // ─────────────────────────────────────────────────────────────
  // SAVED AUDIENCES API
  // ─────────────────────────────────────────────────────────────

  public static async listSavedAudiences(query: { search?: string; page?: number; limit?: number }) {
    const { search, page = 1, limit = 20 } = query;
    const filter: Record<string, any> = {};

    if (search && search.trim()) {
      filter.name = { $regex: search.trim(), $options: 'i' };
    }

    const skip = (Math.max(1, page) - 1) * limit;

    const [audiences, total] = await Promise.all([
      SavedAudience.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SavedAudience.countDocuments(filter),
    ]);

    return {
      audiences,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  public static async saveAudience(data: Partial<ISavedAudience>, user = 'Admin') {
    const estimate = await AudienceFilterEngine.estimateAudience(data.filter || {}, 'email');

    const audience = new SavedAudience({
      ...data,
      lastEstimatedCount: estimate.eligible,
      lastEstimatedBreakdown: {
        totalMatched: estimate.totalMatched,
        emailEligible: estimate.eligible,
        whatsappEligible: estimate.eligible,
        suppressed: estimate.suppressed,
        missingContact: estimate.missingContact,
      },
      lastEstimatedAt: new Date(),
      createdBy: user,
    });

    await audience.save();
    return audience;
  }

  public static async deleteSavedAudience(id: string) {
    return SavedAudience.findByIdAndDelete(id);
  }
}
