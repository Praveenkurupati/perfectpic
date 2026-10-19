// apps/backend/src/services/communication/providers/types.ts

export interface IEmailDispatchOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  headers?: Record<string, string>;
  tags?: Record<string, string>;
  trackingId?: string;
}

export interface IEmailDispatchResult {
  success: boolean;
  messageId?: string;
  provider: string;
  simulated?: boolean;
  error?: string;
  retryable?: boolean;
  code?: string;
  rawResponse?: any;
}

export interface IEmailProvider {
  readonly name: string;
  readonly isConfigured: boolean;
  send(options: IEmailDispatchOptions): Promise<IEmailDispatchResult>;
  validateRecipient(email: string): boolean;
  getRateLimit(): number; // Max requests per second
}

export interface IWhatsappDispatchOptions {
  to: string;
  templateName?: string;
  languageCode?: string;
  components?: Array<{
    type: 'header' | 'body' | 'button';
    sub_type?: 'url' | 'quick_reply';
    index?: string;
    parameters: Array<{
      type: 'text' | 'currency' | 'date_time' | 'image' | 'document' | 'video';
      text?: string;
      [key: string]: any;
    }>;
  }>;
  freeformText?: string;
  trackingId?: string;
}

export interface IWhatsappDispatchResult {
  success: boolean;
  messageId?: string;
  provider: string;
  simulated?: boolean;
  error?: string;
  retryable?: boolean;
  code?: string;
  rawResponse?: any;
}

export interface IWhatsappProvider {
  readonly name: string;
  readonly isConfigured: boolean;
  send(options: IWhatsappDispatchOptions): Promise<IWhatsappDispatchResult>;
  validateRecipient(phone: string): boolean;
  formatPhone(phone: string): string;
  getRateLimit(): number; // Max requests per second
}
