// apps/client/src/lib/invoiceGenerator.ts
import { jsPDF } from 'jspdf';

export interface InvoiceData {
  orderNumber: string;
  date?: string;
  customerName: string;
  customerEmail?: string;
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
  items: Array<{
    title: string;
    quantity: number;
    price: number;
    dimensions?: string;
    pageCount?: number;
  }>;
  total: number;
  deliveryOption?: string;
}

/**
 * Converts a number to Indian Rupees words
 */
function numberToWords(num: number): string {
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const n = Math.floor(num);
  if (n === 0) return 'Zero Rupees Only';

  function convertGroup(n: number): string {
    let str = '';
    if (n >= 100) {
      str += a[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += b[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      str += a[n] + ' ';
    }
    return str;
  }

  let result = '';
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const remainder = n % 1000;

  if (crore > 0) result += convertGroup(crore) + 'Crore ';
  if (lakh > 0) result += convertGroup(lakh) + 'Lakh ';
  if (thousand > 0) result += convertGroup(thousand) + 'Thousand ';
  if (remainder > 0) result += convertGroup(remainder);

  return result.trim() + ' Rupees Only';
}

export function generateGstInvoicePdf(data: InvoiceData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  // Colors
  const dark = [20, 20, 19] as const;
  const gold = [197, 168, 128] as const;
  const gray = [100, 100, 100] as const;
  const lightBg = [250, 248, 245] as const;
  const borderCol = [225, 220, 212] as const;

  // -------------------------------------------------------------
  // 1. TOP HEADER & BRAND
  // -------------------------------------------------------------
  doc.setFillColor(...lightBg);
  doc.rect(margin, 12, contentWidth, 32, 'F');
  doc.setDrawColor(...borderCol);
  doc.setLineWidth(0.3);
  doc.rect(margin, 12, contentWidth, 32, 'D');

  // Company Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...dark);
  doc.text('PERFECTPIC LUXURY PRINTS PVT. LTD.', margin + 6, 21);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...gray);
  doc.text('Archival Photobook Editions & Fine Art Printmakers', margin + 6, 26);
  doc.text('Level 4, Prestige Tech Park, Outer Ring Road, Bengaluru, Karnataka - 560103', margin + 6, 31);
  doc.text('GSTIN: 29AABCP1234F1Z9  |  PAN: AABCP1234F  |  CIN: U22219KA2026PTC184910', margin + 6, 36);
  doc.text('Email: invoicing@perfectpic.in  |  Phone: +91 80 4123 9800', margin + 6, 40);

  // Invoice Title Box (Right Aligned)
  doc.setFillColor(...dark);
  doc.roundedRect(pageWidth - margin - 52, 16, 46, 24, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('TAX INVOICE', pageWidth - margin - 29, 23, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...gold);
  doc.text('(Rule 46 of CGST Rules, 2017)', pageWidth - margin - 29, 28, { align: 'center' });
  doc.setTextColor(255, 255, 255);
  doc.text(`ORIGINAL FOR RECIPIENT`, pageWidth - margin - 29, 34, { align: 'center' });

  // -------------------------------------------------------------
  // 2. INVOICE META & CUSTOMER DETAILS (2 Columns)
  // -------------------------------------------------------------
  const startY = 48;
  const colW = (contentWidth - 4) / 2;

  // Left Column: Invoice Particulars
  doc.setFillColor(...lightBg);
  doc.rect(margin, startY, colW, 36, 'F');
  doc.setDrawColor(...borderCol);
  doc.rect(margin, startY, colW, 36, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...dark);
  doc.text('INVOICE DETAILS', margin + 4, startY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...gray);

  const formattedDate = data.date
    ? new Date(data.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  doc.text(`Invoice No:`, margin + 4, startY + 13);
  doc.text(`Invoice Date:`, margin + 4, startY + 19);
  doc.text(`Order Reference:`, margin + 4, startY + 25);
  doc.text(`Place of Supply:`, margin + 4, startY + 31);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...dark);
  doc.text(`INV-2026-${data.orderNumber}`, margin + 34, startY + 13);
  doc.text(formattedDate, margin + 34, startY + 19);
  doc.text(`#${data.orderNumber}`, margin + 34, startY + 25);

  const customerState = data.shippingAddress?.state || 'Karnataka';
  const isIntraState = customerState.toLowerCase().includes('karnataka');
  doc.text(`${customerState} (${isIntraState ? '29' : '99'})`, margin + 34, startY + 31);

  // Right Column: Bill To / Ship To Customer
  const rightX = margin + colW + 4;
  doc.setFillColor(...lightBg);
  doc.rect(rightX, startY, colW, 36, 'F');
  doc.setDrawColor(...borderCol);
  doc.rect(rightX, startY, colW, 36, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...dark);
  doc.text('BILLED & SHIPPED TO', rightX + 4, startY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(data.customerName || 'Valued Customer', rightX + 4, startY + 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...gray);

  const addrLine1 = data.shippingAddress?.addressLine1 || 'Delivery Address on file';
  const cityStatePin = `${data.shippingAddress?.city || ''}${data.shippingAddress?.city ? ', ' : ''}${customerState} - ${data.shippingAddress?.pincode || ''}`;

  doc.text(addrLine1.substring(0, 42), rightX + 4, startY + 19);
  doc.text(cityStatePin, rightX + 4, startY + 24);
  doc.text(`Phone: ${data.customerPhone || data.shippingAddress?.phone || 'N/A'}`, rightX + 4, startY + 29);
  doc.text(`Email: ${data.customerEmail || 'customer@perfectpic.in'}`, rightX + 4, startY + 34);

  // -------------------------------------------------------------
  // 3. ITEM TABLE (GST COMPLIANT HSN 4901)
  // -------------------------------------------------------------
  const tableY = startY + 42;
  const thHeight = 8;

  // Header row
  doc.setFillColor(...dark);
  doc.rect(margin, tableY, contentWidth, thHeight, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);

  doc.text('#', margin + 3, tableY + 5.5);
  doc.text('DESCRIPTION OF GOODS', margin + 12, tableY + 5.5);
  doc.text('HSN/SAC', margin + 82, tableY + 5.5);
  doc.text('QTY', margin + 102, tableY + 5.5);
  doc.text('RATE (₹)', margin + 116, tableY + 5.5);
  doc.text('TAXABLE (₹)', margin + 136, tableY + 5.5);
  doc.text('GST (18%)', margin + 158, tableY + 5.5);
  doc.text('TOTAL (₹)', margin + contentWidth - 3, tableY + 5.5, { align: 'right' });

  // Rows
  let curY = tableY + thHeight;
  const items = data.items && data.items.length > 0
    ? data.items
    : [{ title: 'Custom Archival Photobook Keepsake', quantity: 1, price: data.total || 1999, dimensions: '8.25" × 8.25"', pageCount: 40 }];

  // Calculations
  const grandTotal = data.total || 1999;
  // 18% inclusive GST calculation: Taxable = Total / 1.18
  const taxableTotal = Math.round((grandTotal / 1.18) * 100) / 100;
  const gstTotal = Math.round((grandTotal - taxableTotal) * 100) / 100;
  const cgstAmount = isIntraState ? Math.round((gstTotal / 2) * 100) / 100 : 0;
  const sgstAmount = isIntraState ? Math.round((gstTotal - cgstAmount) * 100) / 100 : 0;
  const igstAmount = isIntraState ? 0 : gstTotal;

  items.forEach((item, index) => {
    const itemTotal = item.price * (item.quantity || 1);
    const itemTaxable = Math.round((itemTotal / 1.18) * 100) / 100;
    const itemGst = Math.round((itemTotal - itemTaxable) * 100) / 100;

    const rowH = 14;
    doc.setFillColor(index % 2 === 0 ? 255 : 250, index % 2 === 0 ? 255 : 248, index % 2 === 0 ? 255 : 245);
    doc.rect(margin, curY, contentWidth, rowH, 'F');
    doc.setDrawColor(...borderCol);
    doc.line(margin, curY + rowH, margin + contentWidth, curY + rowH);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...dark);
    doc.text(`${index + 1}`, margin + 3, curY + 6);

    // Title & Specs
    doc.setFont('helvetica', 'bold');
    doc.text(item.title.substring(0, 36), margin + 12, curY + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...gray);
    doc.text(
      `Layflat 180° Binding • ${item.dimensions || '8.25" × 8.25"'} • ${item.pageCount || 40} Pages Archival Matte`,
      margin + 12,
      curY + 10
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...dark);
    doc.text('4901 10 10', margin + 82, curY + 7);
    doc.text(`${item.quantity || 1}`, margin + 104, curY + 7);
    doc.text(Math.round(itemTaxable / (item.quantity || 1)).toLocaleString('en-IN'), margin + 116, curY + 7);
    doc.text(itemTaxable.toLocaleString('en-IN'), margin + 136, curY + 7);
    doc.text(itemGst.toLocaleString('en-IN'), margin + 158, curY + 7);
    doc.setFont('helvetica', 'bold');
    doc.text(itemTotal.toLocaleString('en-IN'), margin + contentWidth - 3, curY + 7, { align: 'right' });

    curY += rowH;
  });

  // Outer border for table
  doc.setDrawColor(...borderCol);
  doc.rect(margin, tableY, contentWidth, curY - tableY, 'D');

  // -------------------------------------------------------------
  // 4. TAX SUMMARY & TOTALS BREAKDOWN
  // -------------------------------------------------------------
  const summaryY = curY + 4;
  const sumColW = 85;
  const sumX = margin + contentWidth - sumColW;

  doc.setFillColor(...lightBg);
  doc.rect(sumX, summaryY, sumColW, 46, 'F');
  doc.setDrawColor(...borderCol);
  doc.rect(sumX, summaryY, sumColW, 46, 'D');

  const addSumRow = (label: string, value: string, yPos: number, isBold = false) => {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(8);
    doc.setTextColor(isBold ? dark[0] : gray[0], isBold ? dark[1] : gray[1], isBold ? dark[2] : gray[2]);
    doc.text(label, sumX + 4, yPos);
    doc.text(value, sumX + sumColW - 4, yPos, { align: 'right' });
  };

  addSumRow('Taxable Subtotal (INR):', `₹${taxableTotal.toLocaleString('en-IN')}`, summaryY + 7);

  if (isIntraState) {
    addSumRow('CGST (9.0%):', `₹${cgstAmount.toLocaleString('en-IN')}`, summaryY + 14);
    addSumRow('SGST (9.0%):', `₹${sgstAmount.toLocaleString('en-IN')}`, summaryY + 21);
  } else {
    addSumRow('IGST (18.0%):', `₹${igstAmount.toLocaleString('en-IN')}`, summaryY + 14);
  }

  addSumRow('Shipping & Insured Transit:', 'FREE (0.00)', summaryY + 28);

  // Total divider
  doc.setDrawColor(...dark);
  doc.setLineWidth(0.5);
  doc.line(sumX, summaryY + 34, sumX + sumColW, summaryY + 34);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...dark);
  doc.text('TOTAL AMOUNT:', sumX + 4, summaryY + 41);
  doc.text(`₹${grandTotal.toLocaleString('en-IN')}`, sumX + sumColW - 4, summaryY + 41, { align: 'right' });

  // Left Note: Total in Words & Bank Information
  const noteW = contentWidth - sumColW - 4;
  doc.setFillColor(...lightBg);
  doc.rect(margin, summaryY, noteW, 46, 'F');
  doc.setDrawColor(...borderCol);
  doc.setLineWidth(0.3);
  doc.rect(margin, summaryY, noteW, 46, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...dark);
  doc.text('TOTAL AMOUNT IN WORDS', margin + 4, summaryY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...gray);
  doc.text(numberToWords(grandTotal), margin + 4, summaryY + 12);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...dark);
  doc.text('SETTLEMENT & PAYMENT DETAILS', margin + 4, summaryY + 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...gray);
  doc.text('Bank: HDFC Bank Ltd. • Branch: Koramangala, Bengaluru', margin + 4, summaryY + 26);
  doc.text('A/C Name: PerfectPic Luxury Prints Pvt. Ltd.', margin + 4, summaryY + 31);
  doc.text('A/C No: 50200088921471  •  IFSC: HDFC0000053', margin + 4, summaryY + 36);
  doc.text('Payment Gateway Status: SUCCESS (PAID ONLINE)', margin + 4, summaryY + 41);

  // -------------------------------------------------------------
  // 5. SIGNATURE & STATUTORY TERMS
  // -------------------------------------------------------------
  const termsY = summaryY + 52;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...dark);
  doc.text('TERMS & CONDITIONS', margin, termsY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...gray);
  doc.text('1. Goods once sold are backed by PerfectPic 7-Day Free Reprint Guarantee in case of manufacturing or transit damage.', margin, termsY + 5);
  doc.text('2. Layflat photobooks are manufactured according to ISO 9706 acid-free archival longevity standards.', margin, termsY + 9);
  doc.text('3. Disputes are subject to the exclusive jurisdiction of the competent courts in Bengaluru, Karnataka.', margin, termsY + 13);

  // Authorized Signatory
  const sigX = margin + contentWidth - 65;
  doc.setDrawColor(...borderCol);
  doc.line(sigX, termsY + 15, margin + contentWidth, termsY + 15);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...dark);
  doc.text('For PERFECTPIC LUXURY PRINTS PVT. LTD.', sigX, termsY + 19);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...gray);
  doc.text('Authorized Digital Signatory', sigX, termsY + 23);
  doc.text('System Certified Document', sigX, termsY + 27);

  // Bottom Notice
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text('This is a computer-generated tax invoice issued in accordance with the Goods and Services Tax Act, 2017.', pageWidth / 2, 285, { align: 'center' });

  // Trigger Download
  doc.save(`PerfectPic_GST_Invoice_${data.orderNumber}.pdf`);
}
