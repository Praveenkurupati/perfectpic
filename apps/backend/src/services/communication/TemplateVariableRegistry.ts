// apps/backend/src/services/communication/TemplateVariableRegistry.ts

export interface IVariableDefinition {
  key: string;
  label: string;
  category: 'customer' | 'order' | 'project' | 'commerce' | 'system';
  description: string;
  exampleValue: string;
  fallbackValue: string;
}

export const VARIABLE_DEFINITIONS: IVariableDefinition[] = [
  // Customer variables
  {
    key: 'first_name',
    label: 'First Name',
    category: 'customer',
    description: "Recipient's first name",
    exampleValue: 'Aarav',
    fallbackValue: 'Friend',
  },
  {
    key: 'last_name',
    label: 'Last Name',
    category: 'customer',
    description: "Recipient's last name",
    exampleValue: 'Sharma',
    fallbackValue: '',
  },
  {
    key: 'full_name',
    label: 'Full Name',
    category: 'customer',
    description: "Recipient's complete name",
    exampleValue: 'Aarav Sharma',
    fallbackValue: 'Valued Customer',
  },
  {
    key: 'email',
    label: 'Email Address',
    category: 'customer',
    description: "Recipient's registered email",
    exampleValue: 'aarav@example.com',
    fallbackValue: '',
  },
  {
    key: 'phone',
    label: 'Phone Number',
    category: 'customer',
    description: "Recipient's mobile number",
    exampleValue: '+91 98765 43210',
    fallbackValue: '',
  },

  // Order variables
  {
    key: 'order_number',
    label: 'Order Number',
    category: 'order',
    description: 'Reference order number',
    exampleValue: 'PP-84920',
    fallbackValue: 'Recent Order',
  },
  {
    key: 'order_total',
    label: 'Order Total',
    category: 'order',
    description: 'Order amount formatted with currency symbol',
    exampleValue: '₹2,499',
    fallbackValue: '',
  },
  {
    key: 'order_status',
    label: 'Order Status',
    category: 'order',
    description: 'Current fulfillment status of the order',
    exampleValue: 'In Production',
    fallbackValue: 'Processing',
  },
  {
    key: 'tracking_url',
    label: 'Tracking Link',
    category: 'order',
    description: 'Live courier tracking URL',
    exampleValue: 'https://perfectpic.in/track/PP-84920',
    fallbackValue: 'https://perfectpic.in/account/orders',
  },

  // Project variables
  {
    key: 'project_title',
    label: 'Project Title',
    category: 'project',
    description: "Title of the customer's photobook project",
    exampleValue: 'Summer in Goa 2026',
    fallbackValue: 'Your Photobook',
  },
  {
    key: 'project_editor_url',
    label: 'Editor Resume Link',
    category: 'project',
    description: 'Direct deep-link to continue photo album editing',
    exampleValue: 'https://perfectpic.in/editor?project=proj_981',
    fallbackValue: 'https://perfectpic.in/account/projects',
  },

  // Commerce & Rewards
  {
    key: 'discount_code',
    label: 'Discount / Promo Code',
    category: 'commerce',
    description: 'Promotional coupon code for checkout',
    exampleValue: 'SPRING25',
    fallbackValue: 'MEMORIES10',
  },
  {
    key: 'discount_percent',
    label: 'Discount Percent',
    category: 'commerce',
    description: 'Discount percentage value',
    exampleValue: '25%',
    fallbackValue: '20%',
  },
  {
    key: 'store_credit_balance',
    label: 'Store Credit Balance',
    category: 'commerce',
    description: 'Current digital wallet balance',
    exampleValue: '₹500',
    fallbackValue: '₹0',
  },

  // System & Legal
  {
    key: 'company_name',
    label: 'Company Name',
    category: 'system',
    description: 'Brand name',
    exampleValue: 'PerfectPic Archival Photobooks',
    fallbackValue: 'PerfectPic',
  },
  {
    key: 'current_year',
    label: 'Current Year',
    category: 'system',
    description: 'Four digit current year for copyright',
    exampleValue: new Date().getFullYear().toString(),
    fallbackValue: '2026',
  },
  {
    key: 'support_email',
    label: 'Support Email',
    category: 'system',
    description: 'Customer assistance email',
    exampleValue: 'support@perfectpic.in',
    fallbackValue: 'support@perfectpic.in',
  },
  {
    key: 'unsubscribe_url',
    label: 'Unsubscribe Link',
    category: 'system',
    description: 'CAN-SPAM / IT Act compliant one-click unsubscribe URL',
    exampleValue: 'https://perfectpic.in/api/v1/campaigns/unsubscribe?token=sample',
    fallbackValue: 'https://perfectpic.in/account/settings',
  },
];

export class TemplateVariableRegistry {
  private static readonly VARIABLE_REGEX = /\{\{\s*([a-zA-Z0-9_-]+)(?:\|([^}]+))?\s*\}\}/g;

  /**
   * Get all registered variable definitions
   */
  public static getAllDefinitions(): IVariableDefinition[] {
    return VARIABLE_DEFINITIONS;
  }

  /**
   * Extract all variable keys used in a template text or HTML string
   * e.g. "Hello {{first_name|Friend}}, your order {{order_number}} is ready!" -> ['first_name', 'order_number']
   */
  public static extractVariables(text: string): string[] {
    if (!text) return [];
    const keys = new Set<string>();
    let match: RegExpExecArray | null;
    const regex = new RegExp(this.VARIABLE_REGEX.source, 'g');

    while ((match = regex.exec(text)) !== null) {
      if (match[1]) {
        keys.add(match[1].trim());
      }
    }

    return Array.from(keys);
  }

  /**
   * Generates a sample payload fixture containing mock values for all requested variables
   */
  public static generateSampleData(variableKeys: string[]): Record<string, string> {
    const defMap = new Map(VARIABLE_DEFINITIONS.map(d => [d.key, d]));
    const result: Record<string, string> = {};

    for (const key of variableKeys) {
      const def = defMap.get(key);
      result[key] = def ? def.exampleValue : `[${key}]`;
    }

    return result;
  }

  /**
   * Safely interpolates text containing `{{var|default}}` or `{{var}}` placeholders.
   * If a value is missing or empty, uses the pipe default `{{var|default}}` if provided,
   * then the registered fallback, and finally removes the token cleanly to prevent `{{undefined}}` leaks.
   */
  public static interpolate(
    templateText: string,
    data: Record<string, any> = {},
    options: { strict?: boolean } = {}
  ): string {
    if (!templateText) return '';
    const defMap = new Map(VARIABLE_DEFINITIONS.map(d => [d.key, d]));

    return templateText.replace(this.VARIABLE_REGEX, (match, key, inlineDefault) => {
      const trimmedKey = key.trim();
      const val = data[trimmedKey];

      if (val !== undefined && val !== null && String(val).trim() !== '') {
        return String(val);
      }

      // 1. Try inline default {{var|default}}
      if (inlineDefault !== undefined && inlineDefault !== null) {
        return inlineDefault.trim();
      }

      // 2. Try registry fallback
      const def = defMap.get(trimmedKey);
      if (def && def.fallbackValue !== undefined) {
        return def.fallbackValue;
      }

      if (options.strict) {
        throw new Error(`Missing required template variable: {{${trimmedKey}}}`);
      }

      // 3. Clean fallback to empty string (prevents raw template tokens leaking to users)
      return '';
    });
  }

  /**
   * Resolves recipient-specific variable dictionary from User and optional Order/Project documents
   */
  public static buildRecipientVariables(user: any, order?: any, project?: any): Record<string, string> {
    const rawName = user.name || user.fullName || '';
    const nameParts = rawName.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    return {
      first_name: firstName,
      last_name: lastName,
      full_name: rawName || 'Valued Customer',
      email: user.email || '',
      phone: user.phone || '',
      order_number: order?.orderNumber || (order?._id ? `PP-${String(order._id).substring(18).toUpperCase()}` : ''),
      order_total: order?.totalAmount ? `₹${Number(order.totalAmount).toLocaleString('en-IN')}` : '',
      order_status: order?.status || '',
      tracking_url: order?.trackingUrl || 'https://perfectpic.in/account/orders',
      project_title: project?.title || 'Your Photobook',
      project_editor_url: project?._id ? `https://perfectpic.in/editor?project=${project._id}` : 'https://perfectpic.in/account/projects',
      discount_code: 'MEMORIES15',
      discount_percent: '15%',
      store_credit_balance: user.storeCreditBalance ? `₹${Number(user.storeCreditBalance).toLocaleString('en-IN')}` : '₹0',
      company_name: 'PerfectPic Archival Photobooks',
      current_year: new Date().getFullYear().toString(),
      support_email: 'support@perfectpic.in',
      unsubscribe_url: `https://perfectpic.in/unsubscribe?email=${encodeURIComponent(user.email || '')}&token=${user._id}`,
    };
  }
}
