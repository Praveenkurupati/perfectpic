// apps/backend/src/services/communication/providers/WhatsappProvider.ts
import { IWhatsappProvider, IWhatsappDispatchOptions, IWhatsappDispatchResult } from './types';
import { WhatsappService } from '../../WhatsappService';
import { logger } from '../../../utils/logger';

/**
 * Meta Cloud API / Kapso WhatsApp Provider
 */
export class MetaWhatsappProvider implements IWhatsappProvider {
  public readonly name = 'meta_cloud';

  public get isConfigured(): boolean {
    return WhatsappService.isConfigured;
  }

  public formatPhone(phone: string): string {
    return WhatsappService.formatPhoneNumber(phone);
  }

  public validateRecipient(phone: string): boolean {
    const formatted = this.formatPhone(phone);
    // Standard E.164 without plus: usually 10-15 digits
    return formatted.length >= 10 && formatted.length <= 15 && /^\d+$/.test(formatted);
  }

  public getRateLimit(): number {
    return 30; // Meta standard Cloud API tier throughput
  }

  public async send(options: IWhatsappDispatchOptions): Promise<IWhatsappDispatchResult> {
    const { to, templateName, languageCode = 'en_US', components, freeformText } = options;

    if (!this.validateRecipient(to)) {
      return {
        success: false,
        provider: this.name,
        error: `Invalid recipient phone number: "${to}"`,
        retryable: false,
        code: 'INVALID_PHONE_NUMBER',
      };
    }

    try {
      // 1. Template-based dispatch (bulk campaigns must use approved Meta templates)
      if (templateName) {
        const result = await WhatsappService.sendTemplateMessage({
          to,
          templateName,
          languageCode,
          components: components || [],
        });

        return {
          success: result.success,
          provider: this.name,
          messageId: result.messageId,
          simulated: result.simulated,
          error: result.error,
          retryable: !result.success && !result.error?.includes('invalid'),
        };
      }

      // 2. Freeform text fallback (service windows or customer care)
      if (freeformText) {
        const result = await WhatsappService.sendTextMessage({
          to,
          message: freeformText,
        });

        return {
          success: result.success,
          provider: this.name,
          messageId: result.messageId,
          simulated: result.simulated,
          error: result.error,
          retryable: !result.success,
        };
      }

      return {
        success: false,
        provider: this.name,
        error: 'Either templateName or freeformText must be provided for WhatsApp dispatch',
        retryable: false,
        code: 'MISSING_CONTENT',
      };
    } catch (err: any) {
      logger.error(`❌ [MetaWhatsappProvider] Dispatch error to ${to}: ${err.message}`);
      return {
        success: false,
        provider: this.name,
        error: err.message,
        retryable: true,
        code: 'WHATSAPP_API_EXCEPTION',
        rawResponse: err,
      };
    }
  }
}

/**
 * Mock WhatsApp Provider for local testing and simulations
 */
export class MockWhatsappProvider implements IWhatsappProvider {
  public readonly name = 'mock';
  public readonly isConfigured = true;
  public sentMessages: Array<{ to: string; templateName?: string; sentAt: Date; options: IWhatsappDispatchOptions }> = [];

  public formatPhone(phone: string): string {
    return WhatsappService.formatPhoneNumber(phone);
  }

  public validateRecipient(phone: string): boolean {
    const formatted = this.formatPhone(phone);
    return formatted.length >= 10 && formatted.length <= 15 && /^\d+$/.test(formatted);
  }

  public getRateLimit(): number {
    return 100;
  }

  public async send(options: IWhatsappDispatchOptions): Promise<IWhatsappDispatchResult> {
    if (!this.validateRecipient(options.to)) {
      return {
        success: false,
        provider: this.name,
        error: `Invalid recipient phone number: "${options.to}"`,
        retryable: false,
        code: 'INVALID_PHONE_NUMBER',
      };
    }

    const messageId = `mock_wa_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    this.sentMessages.push({
      to: options.to,
      templateName: options.templateName,
      sentAt: new Date(),
      options,
    });

    return {
      success: true,
      provider: this.name,
      messageId,
      simulated: true,
    };
  }
}
