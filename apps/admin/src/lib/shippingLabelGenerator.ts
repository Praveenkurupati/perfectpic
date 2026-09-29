// apps/admin/src/lib/shippingLabelGenerator.ts
import { jsPDF } from 'jspdf';

export interface ShippingLabelData {
  orderNumber: string;
  awbNumber?: string;
  carrier?: string;
  customerName: string;
  customerPhone?: string;
  shippingAddress?: {
    fullName?: string;
    phone?: string;
    addressLine1?: string;
    landmark?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  weightKg?: string;
  dimensions?: string;
  paymentMode?: string;
}

/**
 * Draws simulated vector barcode lines in jsPDF
 */
function drawBarcode(doc: jsPDF, x: number, y: number, width: number, height: number, code: string) {
  doc.setFillColor(0, 0, 0);
  const bars = 48;
  const barWidth = width / bars;
  for (let i = 0; i < bars; i++) {
    // Variable thickness pattern based on code characters
    const charCode = code.charCodeAt(i % code.length) || 65;
    const isThick = (charCode + i) % 3 === 0;
    const w = isThick ? barWidth * 0.9 : barWidth * 0.45;
    doc.rect(x + i * barWidth, y, w, height, 'F');
  }
}

export function generateShippingLabelPdf(data: ShippingLabelData): void {
  // Standard 4" x 6" thermal shipping label format (101.6mm x 152.4mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [102, 152],
  });

  const width = 102;
  const height = 152;
  const m = 5;

  const awb = data.awbNumber || `BD${Math.floor(100000000 + Math.random() * 900000000)}IN`;
  const carrier = data.carrier || 'BLUEDART APEX AIR';
  const pin = data.shippingAddress?.pincode || '560103';
  const hubCode = `${(data.shippingAddress?.city || 'BLR').substring(0, 3).toUpperCase()} / ${pin.substring(0, 3)}-HUB`;

  // Outer Border
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.8);
  doc.rect(m, m, width - m * 2, height - m * 2);

  // 1. CARRIER HEADER & LOGO
  doc.setFillColor(20, 20, 20);
  doc.rect(m, m, width - m * 2, 16, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text(carrier, width / 2, m + 7, { align: 'center' });

  doc.setFontSize(7.5);
  doc.setTextColor(212, 175, 55);
  doc.text('EXPRESS AIR CARGO • PRIORITY HANDLED', width / 2, m + 12, { align: 'center' });

  // 2. ROUTING HUB & PAYMENT BADGE
  let y = m + 16;
  doc.setFillColor(245, 245, 245);
  doc.rect(m, y, width - m * 2, 14, 'F');
  doc.setLineWidth(0.4);
  doc.line(m, y + 14, width - m, y + 14);

  // Left: Hub Code
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(hubCode, m + 4, y + 9);

  // Right: Prepaid Stamp
  doc.setFillColor(0, 0, 0);
  doc.roundedRect(width - m - 32, y + 2.5, 28, 9, 1, 1, 'F');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text(data.paymentMode || 'PREPAID', width - m - 18, y + 8, { align: 'center' });

  // 3. BARCODE & AWB NUMBER
  y += 14;
  drawBarcode(doc, m + 8, y + 4, width - m * 2 - 16, 16, awb);

  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`AWB: ${awb}`, width / 2, y + 25, { align: 'center' });

  doc.setLineWidth(0.4);
  doc.line(m, y + 28, width - m, y + 28);

  // 4. SHIP TO / CONSIGNEE (PRIMARY SECTION)
  y += 28;
  doc.setFillColor(250, 248, 245);
  doc.rect(m, y, width - m * 2, 38, 'F');
  doc.line(m, y + 38, width - m, y + 38);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text('DELIVER TO (CONSIGNEE):', m + 4, y + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(data.customerName.toUpperCase(), m + 4, y + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const addr = data.shippingAddress?.addressLine1 || 'Delivery Address on file';
  doc.text(addr.substring(0, 44), m + 4, y + 16);
  if (data.shippingAddress?.landmark) {
    doc.text(`Near: ${data.shippingAddress.landmark}`, m + 4, y + 20);
  }
  doc.text(`${data.shippingAddress?.city || ''}, ${data.shippingAddress?.state || ''}`, m + 4, y + 25);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(`PIN: ${pin}`, m + 4, y + 32);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Phone: ${data.customerPhone || data.shippingAddress?.phone || 'N/A'}`, m + 50, y + 32);

  // 5. SHIP FROM / DISPATCHER
  y += 38;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 100, 100);
  doc.text('RETURN / DISPATCHED BY:', m + 4, y + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(0, 0, 0);
  doc.text('PERFECTPIC FULFILLMENT HUB', m + 4, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Level 4, Prestige Tech Park, Outer Ring Road, Bengaluru - 560103', m + 4, y + 13);
  doc.text('Customer Helpdesk: +91 80 4123 9800 | support@perfectpic.in', m + 4, y + 17);

  doc.line(m, y + 20, width - m, y + 20);

  // 6. ORDER PARTICULARS & HANDLING INSTRUCTIONS
  y += 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text(`ORDER ID: #${data.orderNumber}`, m + 4, y + 5);
  doc.text(`WEIGHT: ${data.weightKg || '0.85 KG'}`, m + 44, y + 5);
  doc.text(`PIECES: 1 / 1`, m + 76, y + 5);

  // Fragile Box
  doc.setFillColor(240, 240, 240);
  doc.rect(m + 2, y + 8, width - m * 2 - 4, 12, 'F');
  doc.setDrawColor(0, 0, 0);
  doc.rect(m + 2, y + 8, width - m * 2 - 4, 12, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(180, 0, 0);
  doc.text('FRAGILE • LUXURY ARCHIVAL PHOTOBOOK • DO NOT BEND', width / 2, y + 14, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(80, 80, 80);
  doc.text('Moisture Barrier Protected • Keep Away From Extreme Heat', width / 2, y + 18, { align: 'center' });

  // Save PDF
  doc.save(`Shipping_Label_${data.orderNumber}_${awb}.pdf`);
}
