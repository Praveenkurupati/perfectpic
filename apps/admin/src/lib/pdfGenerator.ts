// apps/admin/src/lib/pdfGenerator.ts
import { jsPDF } from 'jspdf';

export interface AdminPrintPdfOptions {
  orderNumber: string;
  title: string;
  customerName?: string;
  customerEmail?: string;
  dimensions?: string;
  pages?: number;
  status?: string;
  coverImage?: string;
  photos?: string[];
  dueDate?: string;
}

/**
 * Converts image to Base64 via canvas for PDF embedding
 */
async function getBase64Image(url: string): Promise<string | null> {
  if (!url || typeof window === 'undefined') return null;
  if (url.startsWith('data:image/')) return url;

  // Attempt 1: Fetch via blob & FileReader (avoids Canvas security taint)
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (res.ok) {
      const blob = await res.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    }
  } catch {
    // Proceed to fallback
  }

  // Attempt 2: Canvas draw fallback with crossOrigin
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
        } catch {}
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
 * Generates an HP Indigo Production Print Run PDF for admin bindery queue.
 */
export async function generateAdminProductionPdf(options: AdminPrintPdfOptions): Promise<void> {
  const {
    orderNumber,
    title,
    customerName = 'Customer',
    dimensions = '8.25" × 8.25"',
    pages = 40,
    coverImage,
    photos = [],
    dueDate = 'Immediate',
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [210, 210],
  });

  const width = 210;
  const height = 210;

  // ----------------------------------------------------------------------
  // COVER SHEET: HP INDIGO JOB TICKET & CALIBRATION
  // ----------------------------------------------------------------------
  doc.setFillColor(18, 18, 18);
  doc.rect(0, 0, width, height, 'F');

  // Job ticket header
  doc.setFont('courier', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(`[PRODUCTION PRINT RUN] JOB #${orderNumber}`, 15, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(212, 175, 55);
  doc.text(`HP INDIGO 12000 DIGITAL PRESS • 12-COLOR CMYK + LIGHT CYAN + LIGHT MAGENTA`, 15, 27);

  // Ticket specifications table
  doc.setFillColor(30, 30, 30);
  doc.roundedRect(15, 33, width - 30, 42, 2, 2, 'F');

  doc.setFont('courier', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(220, 220, 220);
  doc.text(`PROJECT TITLE : ${title.toUpperCase()}`, 20, 42);
  doc.text(`CUSTOMER NAME : ${customerName.toUpperCase()}`, 20, 48);
  doc.text(`PAGE COUNT    : ${pages} PAGES (${Math.ceil(pages / 2)} SPREADS)`, 20, 54);
  doc.text(`DIMENSIONS    : ${dimensions}`, 20, 60);
  doc.text(`BINDING TYPE  : PUR-MELT 180° LAY-FLAT WITH ZERO GUTTER DISTORTION`, 20, 66);
  doc.text(`TARGET DUE    : ${dueDate.toUpperCase()}`, width - 75, 42);

  // CMYK Color calibration control strip
  const swatches = ['#000000', '#009ee0', '#e5007d', '#ffed00', '#009640', '#e30613', '#662483', '#d4af37'];
  swatches.forEach((sw, i) => {
    doc.setFillColor(sw);
    doc.rect(15 + i * 22.5, 80, 20, 6, 'F');
  });

  // Cover Image
  let coverBase64 = coverImage ? await getBase64Image(coverImage) : null;
  if (!coverBase64 && photos[0]) coverBase64 = await getBase64Image(photos[0]);

  const imgX = 25;
  const imgY = 92;
  const imgW = 160;
  const imgH = 95;

  if (coverBase64) {
    try {
      doc.addImage(coverBase64, 'JPEG', imgX, imgY, imgW, imgH);
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.3);
      doc.rect(imgX, imgY, imgW, imgH);
    } catch {
      doc.setFillColor(45, 45, 45);
      doc.rect(imgX, imgY, imgW, imgH, 'F');
    }
  } else {
    doc.setFillColor(45, 45, 45);
    doc.rect(imgX, imgY, imgW, imgH, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(200, 200, 200);
    doc.text('COVER PLATE - HIGH RESOLUTION CMYK', width / 2, imgY + imgH / 2, { align: 'center' });
  }

  // Footer Job Barcode
  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(150, 150, 150);
  doc.text(`PERFECTPIC AUTOMATED BINDERY PIPELINE • BATCH TRACE: ${orderNumber}-INDIGO-12K`, width / 2, 202, { align: 'center' });

  // ----------------------------------------------------------------------
  // INSIDE SPREAD PAGES (1 PHOTO PER PAGE PRINT SPEC)
  // ----------------------------------------------------------------------
  const spreadCount = Math.min(3, Math.ceil(pages / 2));
  for (let s = 1; s <= spreadCount; s++) {
    doc.addPage([210, 210], 'portrait');
    doc.setFillColor(252, 251, 248);
    doc.rect(0, 0, width, height, 'F');

    // Safe cutting lines (bleed marks)
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.25);
    doc.line(10, 0, 10, 10);
    doc.line(0, 10, 10, 10);
    doc.line(width - 10, 0, width - 10, 10);
    doc.line(width, 10, width - 10, 10);

    // Spine folding line
    doc.setDrawColor(210, 180, 120);
    doc.setLineWidth(0.3);
    doc.line(width / 2, 10, width / 2, height - 10);

    // Spread metadata
    doc.setFont('courier', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text(`JOB: ${orderNumber} • SPREAD ${s} • TRIM: 210x210mm • BLEED: 3mm`, 15, 8);

    const photoUrl = photos[(s - 1) % (photos.length || 1)] || coverImage;
    const photoBase64 = photoUrl ? await getBase64Image(photoUrl) : null;

    const sImgX = 22;
    const sImgY = 22;
    const sImgW = 166;
    const sImgH = 155;

    if (photoBase64) {
      try {
        doc.addImage(photoBase64, 'JPEG', sImgX, sImgY, sImgW, sImgH);
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.3);
        doc.rect(sImgX, sImgY, sImgW, sImgH);
      } catch {
        doc.setFillColor(235, 235, 230);
        doc.rect(sImgX, sImgY, sImgW, sImgH, 'F');
      }
    } else {
      doc.setFillColor(235, 235, 230);
      doc.rect(sImgX, sImgY, sImgW, sImgH, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text(`INTERIOR SPREAD ${s} CONTENT AREA`, width / 2, sImgY + sImgH / 2, { align: 'center' });
    }

    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 120);
    doc.text(`PAGES ${(s - 1) * 2 + 1} - ${(s - 1) * 2 + 2} OF ${pages}`, width / 2, 195, { align: 'center' });
  }

  doc.save(`Production_Print_Run_${orderNumber}.pdf`);
}

/**
 * Generates an Admin Invoice PDF for archiving or accounting.
 */
export async function generateAdminInvoicePdf(order: any): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const width = 210;
  const orderNum = order?.orderNumber || order?.id || 'PP-8491';
  const total = order?.total || order?.amount || 1999;

  doc.setFillColor(20, 20, 20);
  doc.rect(0, 0, width, 35, 'F');

  doc.setFont('times', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text('PERFECTPIC ENTERPRISE', 15, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(212, 175, 55);
  doc.text('ADMINISTRATIVE INVOICE RECORD', 15, 27);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(`ORDER #${orderNum}`, width - 15, 22, { align: 'right' });

  let y = 50;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);
  doc.text('CUSTOMER INFORMATION', 15, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text(`Name: ${order?.customerName || 'Valued Customer'}`, 15, y + 6);
  doc.text(`Email: ${order?.customerEmail || 'customer@perfectpic.in'}`, 15, y + 11);
  doc.text(`Phone: ${order?.customerPhone || '+91 98765 43210'}`, 15, y + 16);
  doc.text(`Status: ${(order?.status || 'Confirmed').toUpperCase()}`, 15, y + 21);

  y += 35;
  doc.setFillColor(245, 245, 245);
  doc.rect(15, y, width - 30, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(40, 40, 40);
  doc.text('LINE ITEM', 20, y + 5.5);
  doc.text('PRICE', width - 20, y + 5.5, { align: 'right' });

  y += 15;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(order?.title || 'Heirloom Photobook Edition', 20, y);
  doc.text(`₹${Number(total).toLocaleString('en-IN')}`, width - 20, y, { align: 'right' });

  y += 20;
  doc.setDrawColor(200, 200, 200);
  doc.line(15, y, width - 15, y);

  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('TOTAL AMOUNT:', width - 75, y);
  doc.text(`₹${Number(total).toLocaleString('en-IN')}`, width - 20, y, { align: 'right' });

  doc.save(`Admin_Invoice_${orderNum}.pdf`);
}
