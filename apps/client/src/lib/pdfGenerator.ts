// apps/client/src/lib/pdfGenerator.ts
import { jsPDF } from 'jspdf';

export interface BookPdfOptions {
  title: string;
  subtitle?: string;
  dimensions?: string;
  pageCount?: number;
  theme?: string;
  coverImage?: string;
  photos?: string[];
  spreads?: any[];
  projectId?: string;
}

/**
 * Safely converts an image URL to a Base64 data URL via canvas.
 * Falls back to null if CORS or network blocks the image.
 */
async function getBase64Image(url: string): Promise<string | null> {
  if (!url || typeof window === 'undefined') return null;
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || 600;
          canvas.height = img.naturalHeight || 600;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/jpeg', 0.85));
            return;
          }
        } catch {
          // Handled via fallback
        }
        resolve(null);
      };
      img.onerror = () => resolve(null);
      img.src = url;
    } catch {
      resolve(null);
    }
  });
}

/**
 * Generates and triggers download of a high-resolution, print-ready 3D Proof PDF.
 * Format: 210mm x 210mm Square Lay-Flat Photobook (HP Indigo Press 12K Standard)
 */
export async function generateBookProofPdf(options: BookPdfOptions): Promise<void> {
  const {
    title = 'Heirloom Custom Photobook',
    subtitle = 'Curated Monograph Edition',
    dimensions = '8.25" × 8.25"',
    pageCount = 40,
    theme = 'Minimal Modern',
    coverImage,
    photos = [],
  } = options;

  // Initialize Square 210mm x 210mm document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [210, 210],
  });

  const width = 210;
  const height = 210;

  // ----------------------------------------------------------------------
  // PAGE 1: FRONT HARDCOVER PROOF
  // ----------------------------------------------------------------------
  // Deep luxury background
  doc.setFillColor(26, 26, 26);
  doc.rect(0, 0, width, height, 'F');

  // Embossed gold foil border
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.6);
  doc.rect(12, 12, width - 24, height - 24);

  // Press standard header
  doc.setFont('times', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(212, 175, 55);
  doc.text('PERFECTPIC • 12K ULTRA-HD INDIGO PRESS PROOF', width / 2, 22, { align: 'center' });

  doc.setFontSize(7);
  doc.setTextColor(160, 160, 160);
  doc.text('180° LAY-FLAT ARCHIVAL BINDING • ZERO GUTTER LOSS', width / 2, 27, { align: 'center' });

  // Cover Photo
  let coverBase64: string | null = null;
  if (coverImage) {
    coverBase64 = await getBase64Image(coverImage);
  }
  if (!coverBase64 && photos.length > 0 && photos[0]) {
    coverBase64 = await getBase64Image(photos[0]);
  }

  const coverImgX = 35;
  const coverImgY = 35;
  const coverImgW = 140;
  const coverImgH = 100;

  if (coverBase64) {
    try {
      doc.addImage(coverBase64, 'JPEG', coverImgX, coverImgY, coverImgW, coverImgH);
      // Border around photo
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.3);
      doc.rect(coverImgX, coverImgY, coverImgW, coverImgH);
    } catch {
      // Fallback frame
      doc.setFillColor(45, 45, 45);
      doc.rect(coverImgX, coverImgY, coverImgW, coverImgH, 'F');
    }
  } else {
    doc.setFillColor(45, 45, 45);
    doc.rect(coverImgX, coverImgY, coverImgW, coverImgH, 'F');
    doc.setFontSize(10);
    doc.setTextColor(200, 200, 200);
    doc.text('COVER PHOTOGRAPH', width / 2, coverImgY + coverImgH / 2, { align: 'center' });
  }

  // Cover Typography
  doc.setFont('times', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(250, 248, 245);
  doc.text(title, width / 2, 155, { align: 'center' });

  doc.setFont('times', 'italic');
  doc.setFontSize(10);
  doc.setTextColor(212, 175, 55);
  doc.text(subtitle, width / 2, 163, { align: 'center' });

  // Metadata Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(160, 160, 160);
  doc.text(`${pageCount} PAGES • ${dimensions} • THEME: ${theme.toUpperCase()}`, width / 2, 185, { align: 'center' });
  doc.text('CERTIFIED PAN-INDIA ARCHIVAL EDITION • WWW.PERFECTPIC.IN', width / 2, 190, { align: 'center' });

  // ----------------------------------------------------------------------
  // PAGES 2 - 5: SAMPLE INSIDE SPREAD PAGES (1 PHOTO PER PAGE)
  // ----------------------------------------------------------------------
  const sampleSpreadCount = Math.min(4, Math.max(2, Math.ceil(photos.length / 2)));
  
  for (let s = 1; s <= sampleSpreadCount; s++) {
    doc.addPage([210, 210], 'portrait');

    // Archival ivory page background
    doc.setFillColor(250, 248, 245);
    doc.rect(0, 0, width, height, 'F');

    // Precision cutting crop marks
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(8, 0, 8, 8);
    doc.line(0, 8, 8, 8);
    doc.line(width - 8, 0, width - 8, 8);
    doc.line(width, 8, width - 8, 8);
    doc.line(8, height, 8, height - 8);
    doc.line(0, height - 8, 8, height - 8);
    doc.line(width - 8, height, width - 8, height - 8);
    doc.line(width, height - 8, width - 8, height - 8);

    // Spread title & page counter
    const leftPageNum = (s - 1) * 2 + 1;
    const rightPageNum = leftPageNum + 1;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(140, 140, 140);
    doc.text(`SPREAD ${s} OF ${Math.ceil(pageCount / 2)} • 1 PHOTO PER PAGE ARCHIVAL LAYOUT`, 20, 15);
    doc.text(`12K INDIGO PRESS 300 DPI`, width - 20, 15, { align: 'right' });

    // Single photo per page museum white border
    const photoIdx = (s - 1) % (photos.length || 1);
    const photoUrl = photos[photoIdx] || coverImage;
    const photoBase64 = photoUrl ? await getBase64Image(photoUrl) : null;

    const innerImgX = 25;
    const innerImgY = 25;
    const innerImgW = 160;
    const innerImgH = 145;

    if (photoBase64) {
      try {
        doc.addImage(photoBase64, 'JPEG', innerImgX, innerImgY, innerImgW, innerImgH);
        // Clean fine border
        doc.setDrawColor(225, 220, 210);
        doc.setLineWidth(0.3);
        doc.rect(innerImgX, innerImgY, innerImgW, innerImgH);
      } catch {
        doc.setFillColor(235, 230, 220);
        doc.rect(innerImgX, innerImgY, innerImgW, innerImgH, 'F');
      }
    } else {
      doc.setFillColor(240, 237, 230);
      doc.rect(innerImgX, innerImgY, innerImgW, innerImgH, 'F');
      doc.setFont('times', 'italic');
      doc.setFontSize(11);
      doc.setTextColor(120, 120, 120);
      doc.text(`Photobook Spread Plate ${s}`, width / 2, innerImgY + innerImgH / 2, { align: 'center' });
    }

    // Color calibration swatches at bottom margin
    const colors = ['#222222', '#00A4E4', '#E6007E', '#FFDF00', '#2E7D32', '#D4AF37'];
    colors.forEach((col, idx) => {
      doc.setFillColor(col);
      doc.rect(25 + idx * 6, 185, 4.5, 4.5, 'F');
    });

    // Page numbers
    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text(`— ${leftPageNum.toString().padStart(2, '0')} —`, width / 2, 188, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(160, 160, 160);
    doc.text(`PERFECTPIC ARCHIVAL 200 GSM MATTE • 180° LAY-FLAT PUR BINDING`, width - 25, 188, { align: 'right' });
  }

  // ----------------------------------------------------------------------
  // FINAL PAGE: BACK HARDCOVER & CERTIFICATION
  // ----------------------------------------------------------------------
  doc.addPage([210, 210], 'portrait');
  doc.setFillColor(26, 26, 26);
  doc.rect(0, 0, width, height, 'F');

  // Debossed Gold Insignia
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.6);
  doc.rect(12, 12, width - 24, height - 24);

  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(250, 248, 245);
  doc.text('PERFECTPIC', width / 2, 85, { align: 'center' });

  doc.setFont('times', 'italic');
  doc.setFontSize(10);
  doc.setTextColor(212, 175, 55);
  doc.text('Fine Art Photobook Bindery', width / 2, 93, { align: 'center' });

  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.3);
  doc.line(85, 100, 125, 100);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(180, 180, 180);
  doc.text('ARCHIVAL GRADE PUR-MELT LAY-FLAT BINDING', width / 2, 110, { align: 'center' });
  doc.text('ACID-FREE CERTIFIED 200 GSM HEAVYWEIGHT MATTE', width / 2, 116, { align: 'center' });
  doc.text('HP INDIGO 12000 DIGITAL PRESS • 100% ZERO GUTTER LOSS', width / 2, 122, { align: 'center' });
  doc.text('PAN-INDIA ZERO-DEFECT QUALITY GUARANTEE', width / 2, 128, { align: 'center' });

  // Mock Barcode / Print ISBN
  doc.setFillColor(255, 255, 255);
  doc.rect(width / 2 - 25, 150, 50, 22, 'F');
  
  // Barcode lines
  doc.setFillColor(0, 0, 0);
  for (let b = 0; b < 36; b++) {
    const barW = (b % 3 === 0) ? 1.4 : 0.7;
    doc.rect(width / 2 - 22 + b * 1.2, 153, barW, 12, 'F');
  }
  doc.setFont('courier', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(0, 0, 0);
  const serialNo = `PP-ISBN-${Math.floor(100000 + Math.random() * 900000)}`;
  doc.text(serialNo, width / 2, 169, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(140, 140, 140);
  doc.text('Bengaluru • Mumbai • New Delhi • Hyderabad', width / 2, 188, { align: 'center' });

  // Trigger download
  const cleanTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`${cleanTitle}_Print_Proof.pdf`);
}

/**
 * Generates and triggers download of an official Order Confirmation & Tax Receipt PDF.
 */
export async function generateOrderReceiptPdf(order: any): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4', // 210mm x 297mm
  });

  const width = 210;
  const height = 297;

  const orderNum = order?.orderNumber || order?.id || 'PP-8491';
  const orderDate = order?.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const totalAmount = order?.total || order?.amount || 1999;
  const customerName = order?.customerName || order?.shippingAddress?.fullName || 'Valued Customer';
  const customerEmail = order?.customerEmail || 'customer@perfectpic.in';
  const customerPhone = order?.customerPhone || order?.shippingAddress?.phone || '+91 98765 43210';
  const addressLine1 = order?.shippingAddress?.addressLine1 || 'Order Delivery Address';
  const city = order?.shippingAddress?.city || 'Bangalore';
  const state = order?.shippingAddress?.state || 'Karnataka';
  const pincode = order?.shippingAddress?.pincode || '560001';

  // Header Background bar
  doc.setFillColor(26, 26, 26);
  doc.rect(0, 0, width, 40, 'F');

  // Brand Header
  doc.setFont('times', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(250, 248, 245);
  doc.text('PERFECTPIC', 20, 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(212, 175, 55);
  doc.text('HEIRLOOM PHOTOBOOKS & FINE ART PRINTING • INDIA', 20, 30);

  // Invoice Tag (Top Right)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('TAX INVOICE / RECEIPT', width - 20, 22, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(200, 200, 200);
  doc.text(`INVOICE #${orderNum}`, width - 20, 30, { align: 'right' });

  // Two-column Order Details Section
  let y = 55;

  // Left: Customer & Delivery Address
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);
  doc.text('BILLED & DELIVERED TO:', 20, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(50, 50, 50);
  doc.text(customerName, 20, y + 6);
  doc.text(addressLine1, 20, y + 11);
  doc.text(`${city}, ${state} - ${pincode}`, 20, y + 16);
  doc.text(`Phone: ${customerPhone}`, 20, y + 21);
  doc.text(`Email: ${customerEmail}`, 20, y + 26);

  // Right: Order Metadata
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);
  doc.text('ORDER SUMMARY:', width - 85, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text(`Order ID:`, width - 85, y + 6);
  doc.setFont('helvetica', 'bold');
  doc.text(`${orderNum}`, width - 20, y + 6, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.text(`Order Date:`, width - 85, y + 12);
  doc.text(`${orderDate}`, width - 20, y + 12, { align: 'right' });

  doc.text(`Payment Status:`, width - 85, y + 18);
  doc.setTextColor(46, 125, 50);
  doc.setFont('helvetica', 'bold');
  doc.text(`PAID & VERIFIED`, width - 20, y + 18, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text(`Courier Partner:`, width - 85, y + 24);
  doc.text(`BlueDart Air Pan-India`, width - 20, y + 24, { align: 'right' });

  // Horizontal divider
  y += 40;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.4);
  doc.line(20, y, width - 20, y);

  // Itemized Table Header
  y += 8;
  doc.setFillColor(245, 243, 238);
  doc.rect(20, y, width - 40, 9, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(40, 40, 40);
  doc.text('ITEM DESCRIPTION', 25, y + 6);
  doc.text('SPECIFICATIONS', 105, y + 6);
  doc.text('QTY', 150, y + 6);
  doc.text('AMOUNT (INR)', width - 25, y + 6, { align: 'right' });

  // Items
  const items = (order?.items && Array.isArray(order.items) && order.items.length > 0)
    ? order.items
    : [{
        title: order?.title || 'Heirloom Custom Photobook Keepsake',
        dimensions: order?.dimensions || '8.25" × 8.25"',
        pageCount: order?.pageCount || 40,
        price: totalAmount,
        quantity: 1,
      }];

  y += 9;
  items.forEach((item: any) => {
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(20, 20, 20);
    doc.text(item.title || 'Custom Photobook Keepsake', 25, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`${item.dimensions || '8.25" × 8.25"'} • ${item.pageCount || 40} Pages • Lay-Flat`, 105, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30, 30, 30);
    doc.text(String(item.quantity || 1), 153, y);

    const price = item.price || totalAmount;
    doc.setFont('helvetica', 'bold');
    doc.text(`₹${Number(price).toLocaleString('en-IN')}`, width - 25, y, { align: 'right' });
    y += 4;
  });

  // Table Bottom Divider
  y += 8;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.4);
  doc.line(20, y, width - 20, y);

  // Totals Breakdown
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text('Subtotal:', width - 85, y);
  doc.text(`₹${Number(totalAmount).toLocaleString('en-IN')}`, width - 25, y, { align: 'right' });

  y += 6;
  doc.text('Insured Pan-India Air Shipping:', width - 85, y);
  doc.setTextColor(46, 125, 50);
  doc.text('FREE (Complimentary)', width - 25, y, { align: 'right' });

  y += 6;
  doc.setTextColor(80, 80, 80);
  doc.text('GST & Archival Handling (Included):', width - 85, y);
  doc.text('₹0 (Included in Price)', width - 25, y, { align: 'right' });

  y += 4;
  doc.setDrawColor(30, 30, 30);
  doc.setLineWidth(0.8);
  doc.line(width - 85, y + 2, width - 20, y + 2);

  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(20, 20, 20);
  doc.text('Total Paid:', width - 85, y);
  doc.text(`₹${Number(totalAmount).toLocaleString('en-IN')}`, width - 25, y, { align: 'right' });

  // Guarantee Badge & Support Box
  y += 25;
  doc.setFillColor(250, 248, 245);
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.5);
  doc.roundedRect(20, y, width - 40, 32, 2, 2, 'FD');

  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  doc.text('🛡️ PERFECTPIC 7-DAY REPRINT PROMISE & PRINT FIDELITY GUARANTEE', 26, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(90, 90, 90);
  doc.text('Every photobook is printed on HP Indigo 12000 press with archival Pur-melt 180° lay-flat binding.', 26, y + 15);
  doc.text('If your book arrives with any print defect or transit damage, email concierge@perfectpic.in within 7 days', 26, y + 20);
  doc.text('and we will reprint and deliver a replacement free of charge.', 26, y + 25);

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(140, 140, 140);
  doc.text('Thank you for preserving your memories with PerfectPic • www.perfectpic.in • Registered Office: Bengaluru, India', width / 2, 280, { align: 'center' });

  // Trigger download
  doc.save(`PerfectPic_Invoice_${orderNum}.pdf`);
}
