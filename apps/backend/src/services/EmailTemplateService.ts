// apps/backend/src/services/EmailTemplateService.ts
import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface IRenderEmailResult {
  html: string;
  text: string;
}

export class EmailTemplateService {
  private static instance: EmailTemplateService;
  private templateCache: Map<string, Handlebars.TemplateDelegate> = new Map();
  private partialsLoaded = false;
  private templateBaseDir: string;

  private constructor() {
    this.templateBaseDir = this.resolveTemplateDirectory();
    this.registerHelpers();
    this.loadPartials();
  }

  public static getInstance(): EmailTemplateService {
    if (!EmailTemplateService.instance) {
      EmailTemplateService.instance = new EmailTemplateService();
    }
    return EmailTemplateService.instance;
  }

  /**
   * Resolves the template directory across multiple environments
   * (local tsx runtime, compiled dist/ production, or monorepo root)
   */
  private resolveTemplateDirectory(): string {
    const candidates = [
      path.resolve(__dirname, '../templates/emails'),
      path.resolve(__dirname, '../../src/templates/emails'),
      path.resolve(process.cwd(), 'apps/backend/src/templates/emails'),
      path.resolve(process.cwd(), 'src/templates/emails'),
      path.resolve(process.cwd(), 'dist/templates/emails'),
    ];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        logger.info(`📁 [EmailTemplateService] Found email templates at: ${candidate}`);
        return candidate;
      }
    }

    // Default fallback
    return path.resolve(__dirname, '../templates/emails');
  }

  /**
   * Register common Handlebars helpers for enterprise formatting
   */
  private registerHelpers(): void {
    Handlebars.registerHelper('eq', (a, b) => a === b);
    Handlebars.registerHelper('ne', (a, b) => a !== b);
    Handlebars.registerHelper('gt', (a, b) => a > b);
    Handlebars.registerHelper('lt', (a, b) => a < b);
    Handlebars.registerHelper('and', (a, b) => Boolean(a && b));
    Handlebars.registerHelper('or', (a, b) => Boolean(a || b));

    Handlebars.registerHelper('year', () => new Date().getFullYear());

    Handlebars.registerHelper('upper', (str: string) => {
      return typeof str === 'string' ? str.toUpperCase() : '';
    });

    Handlebars.registerHelper('lower', (str: string) => {
      return typeof str === 'string' ? str.toLowerCase() : '';
    });

    Handlebars.registerHelper('currency', (amount: number | string) => {
      const num = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
      return `₹${num.toLocaleString('en-IN')}`;
    });

    Handlebars.registerHelper('formatDate', (date: Date | string) => {
      const d = new Date(date);
      return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    });
  }

  /**
   * Automatically discovers and registers all partial templates in the partials/ directory
   */
  public loadPartials(): void {
    if (this.partialsLoaded) return;

    const partialsDir = path.join(this.templateBaseDir, 'partials');
    if (!fs.existsSync(partialsDir)) {
      // Register in-memory fallback partials if directory does not exist
      this.registerFallbackPartials();
      this.partialsLoaded = true;
      return;
    }

    try {
      const files = fs.readdirSync(partialsDir);
      for (const file of files) {
        if (file.endsWith('.hbs')) {
          const partialName = path.basename(file, '.hbs');
          const content = fs.readFileSync(path.join(partialsDir, file), 'utf-8');
          Handlebars.registerPartial(partialName, content);
          logger.debug(`[EmailTemplateService] Registered partial: "${partialName}"`);
        }
      }
      this.partialsLoaded = true;
    } catch (err: any) {
      logger.warn(`[EmailTemplateService] Failed to load partials from disk: ${err.message}. Using fallback partials.`);
      this.registerFallbackPartials();
      this.partialsLoaded = true;
    }
  }

  private registerFallbackPartials(): void {
    Handlebars.registerPartial(
      'header',
      `<tr><td align="center" style="padding-bottom: 24px;"><div style="font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #111;">PERFECTPIC</div></td></tr>`
    );
    Handlebars.registerPartial(
      'footer',
      `<tr><td align="center" style="padding-top: 24px; font-size: 11px; color: #888;">© {{year}} PerfectPic. All rights reserved.</td></tr>`
    );
  }

  /**
   * Loads and compiles a template file, caching the delegate in memory
   */
  private getCompiledTemplate(templateRelativePath: string): Handlebars.TemplateDelegate {
    const cacheKey = templateRelativePath;
    if (this.templateCache.has(cacheKey)) {
      return this.templateCache.get(cacheKey)!;
    }

    const fullPath = path.join(this.templateBaseDir, `${templateRelativePath}.hbs`);
    let templateSource: string;

    if (fs.existsSync(fullPath)) {
      templateSource = fs.readFileSync(fullPath, 'utf-8');
    } else {
      logger.warn(`[EmailTemplateService] Template file not found: ${fullPath}. Using inline fallback.`);
      templateSource = this.getInlineFallbackTemplate(templateRelativePath);
    }

    const compiled = Handlebars.compile(templateSource);
    this.templateCache.set(cacheKey, compiled);
    return compiled;
  }

  /**
   * High-reliability inline fallback templates so emails NEVER fail due to missing files
   */
  private getInlineFallbackTemplate(templateKey: string): string {
    if (templateKey.includes('otp')) {
      return `
        <div style="text-align: center; padding: 20px;">
          <h2 style="color: #111;">Your Verification Code</h2>
          <p style="color: #666;">Use the verification code below to authenticate:</p>
          <div style="font-size: 36px; font-weight: bold; letter-spacing: 6px; margin: 20px 0; color: #111;">
            {{otpCode}}
          </div>
          <p style="font-size: 12px; color: #888;">Valid for 10 minutes. Do not share with anyone.</p>
        </div>
      `;
    }

    return `<div style="padding: 20px;">{{{content}}}</div>`;
  }

  /**
   * Renders an email template with a layout into both HTML and plaintext strings
   */
  public renderEmail(
    templateName: string,
    context: Record<string, any> = {},
    options: { layout?: string } = {}
  ): IRenderEmailResult {
    this.loadPartials();

    const mergedContext = {
      frontendUrl: env.FRONTEND_URL || 'https://perfectpic.in',
      adminUrl: env.ADMIN_URL || 'https://admin.perfectpic.in',
      year: new Date().getFullYear(),
      brandName: 'PerfectPic',
      supportEmail: env.SMTP_USER || 'noreply@perfectpic.in',
      ...context,
    };

    // 1. Render Body
    const bodyTemplate = this.getCompiledTemplate(templateName);
    const bodyHtml = bodyTemplate(mergedContext);

    // 2. Render Layout
    const layoutName = options.layout || 'layouts/main';
    let fullHtml: string;

    try {
      const layoutTemplate = this.getCompiledTemplate(layoutName);
      fullHtml = layoutTemplate({
        ...mergedContext,
        body: bodyHtml,
        title: context.title || context.subject || 'PerfectPic Notification',
      });
    } catch {
      // If layout fails, use body directly
      fullHtml = bodyHtml;
    }

    // 3. Generate Plaintext Fallback
    const text = this.htmlToPlainText(fullHtml);

    return {
      html: fullHtml,
      text,
    };
  }

  /**
   * Convert rendered HTML into a clean, legible plaintext email version
   */
  private htmlToPlainText(html: string): string {
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<\/h[1-6]>/gi, '\n\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<br\s*[\/]?>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\n\s+\n/g, '\n\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}

export const emailTemplateService = EmailTemplateService.getInstance();
export default emailTemplateService;
