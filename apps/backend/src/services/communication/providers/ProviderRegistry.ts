// apps/backend/src/services/communication/providers/ProviderRegistry.ts
import { IEmailProvider, IWhatsappProvider } from './types';
import { SmtpEmailProvider, AwsSesEmailProvider, MockEmailProvider } from './EmailProvider';
import { MetaWhatsappProvider, MockWhatsappProvider } from './WhatsappProvider';
import { logger } from '../../../utils/logger';

class ProviderRegistryClass {
  private emailProviders: Map<string, IEmailProvider> = new Map();
  private whatsappProviders: Map<string, IWhatsappProvider> = new Map();

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults() {
    // Register Email providers
    const smtp = new SmtpEmailProvider();
    const ses = new AwsSesEmailProvider();
    const mockEmail = new MockEmailProvider();

    this.emailProviders.set('smtp', smtp);
    this.emailProviders.set('ses', ses);
    this.emailProviders.set('mock', mockEmail);

    // Register WhatsApp providers
    const meta = new MetaWhatsappProvider();
    const mockWa = new MockWhatsappProvider();

    this.whatsappProviders.set('meta_cloud', meta);
    this.whatsappProviders.set('mock', mockWa);

    logger.info('🔌 [ProviderRegistry] Initialized communication providers: ' +
      `Email=[${Array.from(this.emailProviders.keys()).join(', ')}], ` +
      `WhatsApp=[${Array.from(this.whatsappProviders.keys()).join(', ')}]`);
  }

  public registerEmailProvider(provider: IEmailProvider) {
    this.emailProviders.set(provider.name, provider);
  }

  public registerWhatsappProvider(provider: IWhatsappProvider) {
    this.whatsappProviders.set(provider.name, provider);
  }

  public getEmailProvider(name?: string): IEmailProvider {
    if (name && this.emailProviders.has(name)) {
      return this.emailProviders.get(name)!;
    }
    // Default selection: If SES is configured, prefer SES; else SMTP; fallback to mock
    const ses = this.emailProviders.get('ses');
    if (ses && ses.isConfigured) return ses;

    const smtp = this.emailProviders.get('smtp');
    if (smtp && smtp.isConfigured) return smtp;

    return smtp || this.emailProviders.get('mock')!;
  }

  public getWhatsappProvider(name?: string): IWhatsappProvider {
    if (name && this.whatsappProviders.has(name)) {
      return this.whatsappProviders.get(name)!;
    }
    const meta = this.whatsappProviders.get('meta_cloud');
    if (meta && meta.isConfigured) return meta;

    return meta || this.whatsappProviders.get('mock')!;
  }

  public listAvailableProviders(): {
    email: Array<{ name: string; isConfigured: boolean; rateLimit: number }>;
    whatsapp: Array<{ name: string; isConfigured: boolean; rateLimit: number }>;
  } {
    return {
      email: Array.from(this.emailProviders.values()).map(p => ({
        name: p.name,
        isConfigured: p.isConfigured,
        rateLimit: p.getRateLimit(),
      })),
      whatsapp: Array.from(this.whatsappProviders.values()).map(p => ({
        name: p.name,
        isConfigured: p.isConfigured,
        rateLimit: p.getRateLimit(),
      })),
    };
  }
}

export const ProviderRegistry = new ProviderRegistryClass();
export default ProviderRegistry;
