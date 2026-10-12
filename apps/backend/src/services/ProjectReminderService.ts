// apps/backend/src/services/ProjectReminderService.ts
import { Project, IProject } from '../db/models/Project';
import { User } from '../db/models/User';
import { isDbConnected } from '../db/connection';
import { WhatsappService } from './WhatsappService';
import { mailService } from './MailService';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export interface IResumeReminderResult {
  projectId: string;
  success: boolean;
  channels: {
    whatsapp?: { dispatched: boolean; error?: string };
    email?: { dispatched: boolean; error?: string };
  };
  progressPercentage: number;
  completedPages: number;
  totalPages: number;
  message?: string;
}

export class ProjectReminderService {
  /**
   * Find draft projects with partial progress that have not been modified recently
   * Default inactivity threshold: 24 hours.
   */
  public static async getAbandonedProjects(options?: { thresholdHours?: number; limit?: number }): Promise<any[]> {
    const thresholdHours = options?.thresholdHours || 24;
    const cutoffDate = new Date(Date.now() - thresholdHours * 60 * 60 * 1000);
    const limit = options?.limit || 50;

    if (isDbConnected()) {
      try {
        const projects = await Project.find({
          status: { $regex: /^draft$/i },
          progressPercentage: { $gt: 0, $lt: 100 },
          updatedAt: { $lte: cutoffDate },
          reminderCount: { $lt: 3 },
        })
          .sort({ updatedAt: -1 })
          .limit(limit)
          .populate('userId', 'name email phone');

        return projects;
      } catch (err: any) {
        logger.error('Failed to query abandoned projects from DB:', err.message);
      }
    }

    // In-memory fallback mock abandoned projects
    return [
      {
        id: 'proj-kerala-draft',
        title: 'kerala · untitled book',
        pageCount: 32,
        completedPages: 24,
        progressPercentage: 75,
        updatedAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
        customerPhone: '+919876543210',
        customerEmail: 'customer@perfectpic.in',
        customerName: 'Praveen',
        reminderCount: 0,
      },
      {
        id: 'proj-netravati-draft',
        title: 'netravati · weekend trek',
        pageCount: 32,
        completedPages: 12,
        progressPercentage: 38,
        updatedAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
        customerPhone: '+919876543210',
        customerEmail: 'customer@perfectpic.in',
        customerName: 'Praveen',
        reminderCount: 1,
      },
    ];
  }

  /**
   * Dispatches a personalized "Resume Project" reminder across WhatsApp and Email
   */
  public static async sendResumeReminder(
    projectId: string,
    options?: {
      channel?: 'whatsapp' | 'email' | 'all';
      customPhone?: string;
      customEmail?: string;
      customName?: string;
    }
  ): Promise<IResumeReminderResult> {
    const channel = options?.channel || 'all';

    let project: any = null;
    let customer: any = null;

    if (isDbConnected()) {
      try {
        project = await Project.findById(projectId).populate('userId');
        if (project && project.userId) {
          customer = project.userId;
        }
      } catch (err: any) {
        logger.warn('Project find failed in reminder service, checking fallback:', err.message);
      }
    }

    if (!project) {
      project = {
        id: projectId,
        title: 'kerala · untitled book',
        pageCount: 32,
        completedPages: 24,
        progressPercentage: 75,
        coverUrl: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&auto=format&fit=crop',
      };
    }

    const completedPages = project.completedPages || Math.round((project.progressPercentage || 50) * (project.pageCount || 32) / 100);
    const totalPages = project.pageCount || 32;
    const progressPercentage = project.progressPercentage || Math.round((completedPages / totalPages) * 100);

    const clientBaseUrl = process.env.CLIENT_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resumeUrl = `${clientBaseUrl}/studio/${projectId}`;

    const customerName = options?.customName || customer?.name || 'there';
    const customerPhone = options?.customPhone || customer?.phone || '+919876543210';
    const customerEmail = options?.customEmail || customer?.email || 'customer@perfectpic.in';

    const result: IResumeReminderResult = {
      projectId,
      success: true,
      channels: {},
      progressPercentage,
      completedPages,
      totalPages,
    };

    // 1. WhatsApp Notification via Kapso.ai Cloud API
    if (channel === 'whatsapp' || channel === 'all') {
      try {
        const whatsappBody = 
`✨ *PerfectPic*: Hi ${customerName}!

Your photobook *"${project.title}"* is *${progressPercentage}% complete* (${completedPages} of ${totalPages} pages crafted).

Your memories are waiting. Pick up right where you left off with 1 click:
👉 ${resumeUrl}

Need assistance? Reply directly to this message.`;

        const waRes = await WhatsappService.sendTextMessage({
          to: customerPhone,
          message: whatsappBody,
          previewUrl: true,
        });

        result.channels.whatsapp = { dispatched: waRes.success, error: waRes.error };
        logger.info(`📲 [ProjectReminder] WhatsApp resume reminder dispatched to ${customerPhone} for project ${projectId}`);
      } catch (err: any) {
        logger.error(`❌ [ProjectReminder] Failed to send WhatsApp reminder:`, err.message);
        result.channels.whatsapp = { dispatched: false, error: err.message };
      }
    }

    // 2. High-converting luxury Email Notification
    if (channel === 'email' || channel === 'all') {
      try {
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F4F2ED; color: #0A0A0A; margin: 0; padding: 40px 20px; }
    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #D9D6CF; padding: 36px 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
    .logo { font-size: 22px; font-weight: 700; letter-spacing: -0.5px; margin-bottom: 24px; text-transform: lowercase; }
    h1 { font-size: 24px; font-weight: 700; margin: 0 0 12px 0; color: #0A0A0A; letter-spacing: -0.5px; }
    p { font-size: 14px; line-height: 1.6; color: #5C5A55; margin: 0 0 20px 0; }
    .progress-box { background: #FAF9F6; border: 1px solid #E5E2DC; border-radius: 12px; padding: 20px; margin: 24px 0; }
    .progress-title { font-size: 13px; font-weight: 600; color: #0A0A0A; margin-bottom: 8px; display: flex; justify-content: space-between; }
    .bar-track { width: 100%; height: 6px; background: #E5E2DC; border-radius: 999px; overflow: hidden; }
    .bar-fill { height: 100%; width: ${progressPercentage}%; background: #0A0A0A; border-radius: 999px; }
    .btn { display: inline-block; background-color: #0A0A0A; color: #ffffff !important; text-decoration: none; font-size: 14px; font-weight: 600; padding: 14px 32px; border-radius: 999px; margin-top: 12px; text-align: center; }
    .footer { text-align: center; font-size: 12px; color: #8C887B; margin-top: 32px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">perfectpic.</div>
    <h1>Your photobook is ${progressPercentage}% complete</h1>
    <p>Hi ${customerName},</p>
    <p>You've already curated <strong>${completedPages} of ${totalPages} pages</strong> for your photobook <em>"${project.title}"</em>. Don't let your stories stay unfinished.</p>
    
    <div class="progress-box">
      <div class="progress-title">
        <span>${project.title}</span>
        <span>${progressPercentage}% done (${completedPages}/${totalPages} pages)</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill"></div>
      </div>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${resumeUrl}" class="btn">Pick Up Where You Left Off →</a>
    </div>

    <p style="font-size: 12px; color: #8C887B; text-align: center; margin-top: 24px;">
      Free Pan-India Delivery · 100% Reprint Guarantee · Archival Layflat Quality
    </p>
  </div>
  <div class="footer">
    © 2026 perfectpic · made with love in India
  </div>
</body>
</html>`;

        const emailSent = await mailService.sendMail({
          to: customerEmail,
          subject: `Your photobook "${project.title}" is ${progressPercentage}% complete ✨`,
          html: emailHtml,
        });

        result.channels.email = { dispatched: emailSent };
        logger.info(`✉️ [ProjectReminder] Email resume reminder sent to ${customerEmail} for project ${projectId}`);
      } catch (err: any) {
        logger.error(`❌ [ProjectReminder] Failed to send email reminder:`, err.message);
        result.channels.email = { dispatched: false, error: err.message };
      }
    }

    // Update reminder counters in database
    if (isDbConnected() && project._id) {
      try {
        await Project.findByIdAndUpdate(project._id, {
          $inc: { reminderCount: 1 },
          $set: { abandonedReminderSentAt: new Date() },
        });
      } catch {}
    }

    return result;
  }

  /**
   * Cron/Worker runner: scans and processes reminders for all eligible abandoned projects
   */
  public static async processPendingReminders(): Promise<{ processed: number; successful: number }> {
    const abandoned = await this.getAbandonedProjects({ thresholdHours: 24, limit: 100 });
    let successful = 0;

    for (const proj of abandoned) {
      const pId = proj.id || proj._id?.toString();
      if (!pId) continue;
      const res = await this.sendResumeReminder(pId, { channel: 'all' });
      if (res.channels.whatsapp?.dispatched || res.channels.email?.dispatched) {
        successful++;
      }
    }

    return { processed: abandoned.length, successful };
  }
}

export default ProjectReminderService;
