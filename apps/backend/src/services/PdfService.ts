// apps/backend/src/services/PdfService.ts
import { jsPDF } from 'jspdf';
import { OrderRepository } from '../repositories/OrderRepository';
import { ApiError } from '../utils/apiError';

export class PdfService {
  /**
   * Generates a binary PDF buffer for an order invoice or production sheet.
   */
  public static async generateOrderPdfBuffer(orderId: string): Promise<Buffer> {
    const order = await OrderRepository.findById(orderId);
    if (!order) {
      throw ApiError.notFound(`Order with ID '${orderId}' not found.`);
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const width = 210;
    const orderNum = (order as any).orderNumber || (order as any).id || orderId;
    const totalAmount = (order as any).total || (order as any).amount || 1999;
    const customerName = (order as any).customerName || (order as any).shippingAddress?.fullName || 'Valued Customer';
    const customerEmail = (order as any).customerEmail || 'customer@perfectpic.in';
    const customerPhone = (order as any).customerPhone || (order as any).shippingAddress?.phone || '+91 98765 43210';
    const address = (order as any).shippingAddress?.addressLine1 || 'Delivery Address';
    const city = (order as any).shippingAddress?.city || 'Bangalore';
    const state = (order as any).shippingAddress?.state || 'Karnataka';
    const pincode = (order as any).shippingAddress?.pincode || '560001';
    const title = (order as any).title || 'Custom Photobook Keepsake';

    // Header Background
    doc.setFillColor(26, 26, 26);
    doc.rect(0, 0, width, 38, 'F');

    // Brand
    doc.setFont('times', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(250, 248, 245);
    doc.text('PERFECTPIC', 20, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(212, 175, 55);
    doc.text('ARCHIVAL PHOTOBOOKS & FINE ART PRINTING • INDIA', 20, 28);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text('OFFICIAL INVOICE & ORDER PROOF', width - 20, 20, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(200, 200, 200);
    doc.text(`#${orderNum}`, width - 20, 28, { align: 'right' });

    // Order Details
    let y = 52;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 30, 30);
    doc.text('DELIVERY TO:', 20, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);
    doc.text(customerName, 20, y + 6);
    doc.text(address, 20, y + 11);
    doc.text(`${city}, ${state} - ${pincode}`, 20, y + 16);
    doc.text(`Phone: ${customerPhone} | Email: ${customerEmail}`, 20, y + 21);

    doc.setFont('helvetica', 'bold');
    doc.text('ORDER SUMMARY:', width - 85, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`Status:`, width - 85, y + 6);
    doc.setTextColor(46, 125, 50);
    doc.setFont('helvetica', 'bold');
    doc.text(`CONFIRMED & PAID`, width - 20, y + 6, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text(`Courier:`, width - 85, y + 12);
    doc.text(`BlueDart Air Pan-India`, width - 20, y + 12, { align: 'right' });

    // Line items
    y += 35;
    doc.setFillColor(245, 243, 238);
    doc.rect(20, y, width - 40, 8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(40, 40, 40);
    doc.text('ITEM', 25, y + 5.5);
    doc.text('SPECIFICATIONS', 110, y + 5.5);
    doc.text('AMOUNT', width - 25, y + 5.5, { align: 'right' });

    y += 8;
    const items = ((order as any).items && Array.isArray((order as any).items) && (order as any).items.length > 0)
      ? (order as any).items
      : [{ title, dimensions: '8.25" × 8.25"', pageCount: 40, price: totalAmount }];

    items.forEach((item: any) => {
      y += 8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 30, 30);
      doc.text(item.title || title, 25, y);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`${item.dimensions || '8.25" × 8.25"'} • ${item.pageCount || 40} Pages`, 110, y);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 30, 30);
      doc.text(`₹${Number(item.price || totalAmount).toLocaleString('en-IN')}`, width - 25, y, { align: 'right' });
    });

    y += 15;
    doc.setDrawColor(220, 220, 220);
    doc.line(20, y, width - 20, y);

    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('TOTAL AMOUNT PAID:', width - 85, y);
    doc.text(`₹${Number(totalAmount).toLocaleString('en-IN')}`, width - 25, y, { align: 'right' });

    // Guarantee
    y += 30;
    doc.setFillColor(250, 248, 245);
    doc.setDrawColor(212, 175, 55);
    doc.roundedRect(20, y, width - 40, 28, 2, 2, 'FD');

    doc.setFont('times', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 30, 30);
    doc.text('🛡️ PERFECTPIC 7-DAY REPRINT PROMISE & PRINT FIDELITY GUARANTEE', 25, y + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(90, 90, 90);
    doc.text('Every book is printed on HP Indigo 12K press with archival 180° lay-flat Pur binding.', 25, y + 14);
    doc.text('If damaged in transit or print defect detected, contact concierge@perfectpic.in within 7 days for free reprint.', 25, y + 20);

    // Return as binary buffer
    const arrayBuffer = doc.output('arraybuffer');
    return Buffer.from(arrayBuffer);
  }
}
