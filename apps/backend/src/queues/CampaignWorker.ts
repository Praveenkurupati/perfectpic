// apps/backend/src/queues/CampaignWorker.ts
import mongoose from 'mongoose';
import { Worker, QueueManager } from './QueueManager';
import { Campaign } from '../db/models/Campaign';
import { CampaignRecipient, RecipientStatus, FailureCategory } from '../db/models/CampaignRecipient';
import { User } from '../db/models/User';
import { AudienceFilterEngine, IAudienceFilter } from '../services/communication/AudienceFilterEngine';
import { SuppressionService } from '../services/communication/SuppressionService';
import { TemplateVariableRegistry } from '../services/communication/TemplateVariableRegistry';
import { ProviderRegistry } from '../services/communication/providers/ProviderRegistry';
import { logger } from '../utils/logger';

// ── 1. Campaign Dispatch Worker (Audience Snapshot & Batch Slicing) ──────────
export const campaignDispatchWorker = new Worker<{
  campaignId: string;
}>(
  'campaignDispatchQueue',
  async (job) => {
    const { campaignId } = job.data;
    logger.info(`📦 [CampaignWorker:Dispatch] Starting dispatch processing for Campaign ${campaignId}`);

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }

    if (campaign.status === 'cancelled' || campaign.status === 'paused') {
      logger.warn(`⚠️ [CampaignWorker:Dispatch] Skipping campaign ${campaignId} with status "${campaign.status}"`);
      return { skipped: true, status: campaign.status };
    }

    // Advance campaign to 'running'
    campaign.status = 'running';
    campaign.startedAt = campaign.startedAt || new Date();
    campaign.auditLog.push({
      action: 'WORKER_DISPATCH_STARTED',
      performedBy: 'QueueWorker',
      timestamp: new Date(),
      details: 'Worker actively segmenting audience and generating recipient jobs',
      newStatus: 'running',
    });
    await campaign.save();

    await job.updateProgress(10);

    // 1. Build MongoDB query from audience filter
    const mongoQuery = await AudienceFilterEngine.buildMongoQuery(campaign.audienceFilter as IAudienceFilter);

    // 2. Stream matching users in cursor batches to avoid memory ballooning
    const userCursor = User.find(mongoQuery)
      .select('_id name email phone notificationPreferences')
      .lean()
      .cursor({ batchSize: 500 });

    const channel = campaign.channel;
    const recipientQueue = QueueManager.getOrCreateQueue('campaignRecipientQueue');

    let totalMatched = 0;
    let eligibleCount = 0;
    let suppressedCount = 0;
    let missingContactCount = 0;
    let optedOutCount = 0;

    let pendingBatchIds: string[] = [];
    const BATCH_SIZE = 50;

    for await (const user of userCursor) {
      totalMatched++;
      const contactVal = channel === 'email' ? user.email : user.phone;
      const hasContact = channel === 'email' ? Boolean(user.email && user.email.includes('@')) : Boolean(user.phone && user.phone.replace(/\D/g, '').length >= 10);

      if (!hasContact) {
        missingContactCount++;
        continue;
      }

      // Check notification preferences
      if (campaign.audienceFilter?.respectNotificationPreferences !== false) {
        const prefs = (user as any).notificationPreferences || {};
        if (channel === 'email' && prefs.emailReminders === false) {
          optedOutCount++;
          continue;
        }
        if (channel === 'whatsapp' && prefs.whatsappReminders === false) {
          optedOutCount++;
          continue;
        }
      }

      // Check suppression
      const suppression = await SuppressionService.isSuppressed(contactVal!, channel);
      const normalizedContact = SuppressionService.normalizeIdentifier(contactVal!, channel);
      const idempotencyKey = `camp_${campaign._id}_${normalizedContact}`;

      if (suppression.suppressed) {
        suppressedCount++;
        await CampaignRecipient.findOneAndUpdate(
          { idempotencyKey },
          {
            $set: {
              campaignId: campaign._id,
              customerId: user._id,
              email: channel === 'email' ? normalizedContact : undefined,
              phone: channel === 'whatsapp' ? normalizedContact : undefined,
              customerName: user.name || '',
              channel,
              status: 'suppressed',
              idempotencyKey,
              failureCategory: 'suppressed',
              failedReason: `Suppression list match: ${suppression.reason}`,
            },
          },
          { upsert: true }
        );
        continue;
      }

      // Eligible recipient
      eligibleCount++;
      const resolvedVariables = TemplateVariableRegistry.buildRecipientVariables(user);

      const recipientDoc = await CampaignRecipient.findOneAndUpdate(
        { idempotencyKey },
        {
          $set: {
            campaignId: campaign._id,
            customerId: user._id,
            email: channel === 'email' ? normalizedContact : undefined,
            phone: channel === 'whatsapp' ? normalizedContact : undefined,
            customerName: user.name || '',
            channel,
            status: 'pending',
            idempotencyKey,
            variables: resolvedVariables,
          },
        },
        { upsert: true, new: true }
      );

      pendingBatchIds.push(String(recipientDoc._id));

      if (pendingBatchIds.length >= BATCH_SIZE) {
        await recipientQueue.add('send-batch', {
          campaignId: String(campaign._id),
          recipientIds: pendingBatchIds,
        });
        pendingBatchIds = [];
      }
    }

    // Flush any remaining recipient IDs in the last batch
    if (pendingBatchIds.length > 0) {
      await recipientQueue.add('send-batch', {
        campaignId: String(campaign._id),
        recipientIds: pendingBatchIds,
      });
      pendingBatchIds = [];
    }

    // Update campaign stats
    campaign.stats.totalRecipients = totalMatched;
    campaign.stats.eligible = eligibleCount;
    campaign.stats.suppressed = suppressedCount;
    campaign.stats.queued = eligibleCount;
    campaign.stats.pending = eligibleCount;

    if (eligibleCount === 0) {
      campaign.status = 'completed';
      campaign.completedAt = new Date();
      campaign.auditLog.push({
        action: 'CAMPAIGN_AUTO_COMPLETED',
        performedBy: 'QueueWorker',
        timestamp: new Date(),
        details: 'No eligible recipients found; campaign completed immediately',
        newStatus: 'completed',
      });
    }

    await campaign.save();
    await job.updateProgress(100);

    logger.info(`✅ [CampaignWorker:Dispatch] Finished dispatch for Campaign ${campaignId}: Matched=${totalMatched}, Eligible=${eligibleCount}, Suppressed=${suppressedCount}`);
    return {
      totalMatched,
      eligibleCount,
      suppressedCount,
      batchesEnqueued: Math.ceil(eligibleCount / BATCH_SIZE),
    };
  },
  { concurrency: 2 }
);

// ── 2. Campaign Recipient Worker (Batch Sender with Controlled Throughput) ────
export const campaignRecipientWorker = new Worker<{
  campaignId: string;
  recipientIds: string[];
}>(
  'campaignRecipientQueue',
  async (job) => {
    const { campaignId, recipientIds } = job.data;
    if (!recipientIds || recipientIds.length === 0) return { sent: 0 };

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      logger.warn(`⚠️ [CampaignWorker:Recipient] Campaign ${campaignId} missing`);
      return { skipped: true };
    }

    // 1. Check if campaign was paused
    if (campaign.status === 'paused') {
      logger.info(`⏸️ [CampaignWorker:Recipient] Campaign ${campaignId} is paused. Leaving batch pending.`);
      return { paused: true };
    }

    // 2. Check if campaign was cancelled
    if (campaign.status === 'cancelled') {
      await CampaignRecipient.updateMany(
        { _id: { $in: recipientIds } },
        { $set: { status: 'cancelled' } }
      );
      return { cancelled: true };
    }

    // 3. Resolve Channel Provider
    const channel = campaign.channel;
    const emailProvider = channel === 'email' ? ProviderRegistry.getEmailProvider(campaign.provider) : null;
    const whatsappProvider = channel === 'whatsapp' ? ProviderRegistry.getWhatsappProvider(campaign.provider) : null;

    const tplSnapshot = campaign.templateSnapshot || {};

    const recipients = await CampaignRecipient.find({
      _id: { $in: recipientIds },
      status: { $in: ['pending', 'failed_retryable'] },
    });

    let sentCount = 0;
    let failedCount = 0;

    for (const recipient of recipients) {
      // Re-verify pause state before each send
      const freshCheck = await Campaign.findById(campaignId).select('status').lean();
      if (freshCheck?.status === 'paused') {
        logger.info(`⏸️ [CampaignWorker:Recipient] Campaign ${campaignId} paused mid-batch. Halting.`);
        break;
      }
      if (freshCheck?.status === 'cancelled') {
        await CampaignRecipient.updateOne({ _id: recipient._id }, { $set: { status: 'cancelled' } });
        continue;
      }

      recipient.status = 'processing';
      recipient.attempts += 1;
      recipient.lastAttemptAt = new Date();
      await recipient.save();

      try {
        if (channel === 'email' && emailProvider && recipient.email) {
          const subject = TemplateVariableRegistry.interpolate(tplSnapshot.subject || 'Special Update from PerfectPic', recipient.variables);
          const html = TemplateVariableRegistry.interpolate(tplSnapshot.contentHtml || '', recipient.variables);
          const text = TemplateVariableRegistry.interpolate(tplSnapshot.contentText || '', recipient.variables);

          const result = await emailProvider.send({
            to: recipient.email,
            subject,
            html,
            text,
          });

          if (result.success) {
            recipient.status = 'sent';
            recipient.sentAt = new Date();
            recipient.providerMessageId = result.messageId;
            sentCount++;
          } else {
            const isRetryable = result.retryable && recipient.attempts < recipient.maxAttempts;
            recipient.status = isRetryable ? 'failed_retryable' : 'failed_permanent';
            recipient.failedReason = result.error;
            recipient.failureCategory = (result.code as FailureCategory) || 'provider_error';
            failedCount++;
          }
        } else if (channel === 'whatsapp' && whatsappProvider && recipient.phone) {
          const result = await whatsappProvider.send({
            to: recipient.phone,
            templateName: tplSnapshot.whatsappTemplateName,
            languageCode: tplSnapshot.whatsappLanguageCode || 'en_US',
            freeformText: TemplateVariableRegistry.interpolate(
              tplSnapshot.contentText || 'Special Announcement from PerfectPic',
              recipient.variables
            ),
          });

          if (result.success) {
            recipient.status = 'sent';
            recipient.sentAt = new Date();
            recipient.providerMessageId = result.messageId;
            sentCount++;
          } else {
            const isRetryable = result.retryable && recipient.attempts < recipient.maxAttempts;
            recipient.status = isRetryable ? 'failed_retryable' : 'failed_permanent';
            recipient.failedReason = result.error;
            recipient.failureCategory = 'provider_error';
            failedCount++;
          }
        }
      } catch (err: any) {
        recipient.status = recipient.attempts < recipient.maxAttempts ? 'failed_retryable' : 'failed_permanent';
        recipient.failedReason = err.message;
        recipient.failureCategory = 'unknown';
        failedCount++;
      }

      await recipient.save();

      // Enforce rate limiting delay if configured
      if (campaign.rateLimitPerSecond && campaign.rateLimitPerSecond > 0) {
        const delayMs = Math.round(1000 / campaign.rateLimitPerSecond);
        await new Promise(res => setTimeout(res, delayMs));
      }
    }

    // Atomically increment campaign delivery counters
    if (sentCount > 0 || failedCount > 0) {
      await Campaign.updateOne(
        { _id: campaignId },
        {
          $inc: {
            'stats.sent': sentCount,
            'stats.failed': failedCount,
            'stats.pending': -(sentCount + failedCount),
          },
        }
      );
    }

    // Check if campaign is now complete
    const remainingPending = await CampaignRecipient.countDocuments({
      campaignId,
      status: { $in: ['pending', 'processing'] },
    });

    if (remainingPending === 0) {
      const finalCampaign = await Campaign.findById(campaignId);
      if (finalCampaign && finalCampaign.status === 'running') {
        finalCampaign.status = 'completed';
        finalCampaign.completedAt = new Date();
        finalCampaign.auditLog.push({
          action: 'CAMPAIGN_COMPLETED',
          performedBy: 'QueueWorker',
          timestamp: new Date(),
          details: `All messages processed. Sent=${finalCampaign.stats.sent}, Failed=${finalCampaign.stats.failed}`,
          newStatus: 'completed',
        });
        await finalCampaign.save();
        logger.info(`🎉 [CampaignWorker:Recipient] Campaign ${campaignId} marked COMPLETED`);
      }
    }

    return { processed: recipients.length, sentCount, failedCount };
  },
  { concurrency: 4 }
);
