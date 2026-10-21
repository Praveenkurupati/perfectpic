/**
 * PerfectPic Admin Panel Terminology & Business Language Dictionary
 * 
 * Centralizes professional enterprise terminology across operations, finance,
 * marketing, and production screens. Replaces developer jargon (database names,
 * queue names, cloud storage acronyms, technical IDs, and internal pipeline jargon)
 * with executive-ready business language.
 */

/**
 * Format order reference for admin screens.
 */
export function formatAdminOrderReference(orderIdOrNumber?: string): string {
  if (!orderIdOrNumber) return 'Unassigned Order';
  if (/^#?PP-\d+/i.test(orderIdOrNumber)) {
    return orderIdOrNumber.startsWith('#') ? orderIdOrNumber : `#${orderIdOrNumber}`;
  }
  if (/^[0-9a-fA-F]{24}$/.test(orderIdOrNumber)) {
    return `#PP-${orderIdOrNumber.slice(-6).toUpperCase()}`;
  }
  return `#PP-${orderIdOrNumber.slice(0, 8).toUpperCase()}`;
}

/**
 * Fulfillment Workflow Stages (replaces "Pipeline Stages")
 */
export const FULFILLMENT_WORKFLOW_STAGES = [
  { id: 'placed', label: 'Order Placed', shortLabel: 'Placed', description: 'Order payment received and ready for review' },
  { id: 'confirmed', label: 'Preflight Verified', shortLabel: 'Verified', description: 'Photo resolution and bleed margins verified' },
  { id: 'production', label: 'Print Preparation', shortLabel: 'Prepress', description: 'Sheet imposition & color calibration prepared' },
  { id: 'printing', label: 'Digital Press Run', shortLabel: 'Printing', description: 'HP Indigo 6-color digital press printing in progress' },
  { id: 'qc', label: 'Binding & Inspection', shortLabel: 'Binding & QC', description: 'Thermal binding, layflat casing, and quality audit' },
  { id: 'dispatched', label: 'Handed to Courier', shortLabel: 'Dispatched', description: 'Packaged in keepsake box and picked up by courier' },
  { id: 'delivered', label: 'Delivered', shortLabel: 'Delivered', description: 'Package successfully delivered to customer' },
  { id: 'cancelled', label: 'Cancelled', shortLabel: 'Cancelled', description: 'Order cancelled and settled' },
] as const;

/**
 * Business replacements for common internal technical terms.
 */
export const BUSINESS_TERMINOLOGY = {
  // Database & Storage
  databaseStorage: 'Catalog & Storefront Data',
  liveDataFeed: 'Authoritative Live Summary',
  cloudMasterStorage: 'High-Resolution Print Master Storage',
  printFileAction: 'Download High-Resolution Print Master PDF',
  generatePrintAction: 'Generate High-Resolution Print Master PDF',
  
  // Delivery & Timelines
  deliveryCommitment: 'Delivery Target & Fulfillment Commitment',
  onTimePerformance: 'On-Time Fulfillment Rate',
  deadlineRisk: 'Delivery Deadline At Risk',
  
  // Processing & Automation
  automatedEngine: 'Automated Processing Engine',
  renderEngine: 'Print Render Engine',
  scheduledDispatch: 'Scheduled Automated Dispatch',
  changeDetails: 'Change Record & Attributes',
  
  // Funnel & Finance
  unclaimedCartValue: 'Unclaimed Cart Value',
  settlementProcessing: 'In Settlement Processing',
} as const;
