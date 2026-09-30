// apps/admin/src/lib/invoiceGenerator.ts
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

const formatNumber = (val: number): string => {
  return Number(val).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatCurrency = (val: number): string => {
  return 'INR ' + formatNumber(val);
};

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
  doc.setFontSize(15);
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
  doc.text('ORIGINAL FOR RECIPIENT', pageWidth - margin - 29, 34, { align: 'center' });

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

  doc.text('Invoice No:', margin + 4, startY + 13);
  doc.text('Invoice Date:', margin + 4, startY + 19);
  doc.text('Order Reference:', margin + 4, startY + 25);
  doc.text('Place of Supply:', margin + 4, startY + 31);

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
  // Exact column allocations:
  // Col 0: #           [14, 22]   width: 8mm   (center at 18)
  // Col 1: DESC        [22, 86]   width: 64mm  (left at 24)
  // Col 2: HSN/SAC     [86, 104]  width: 18mm  (center at 95)
  // Col 3: QTY         [104, 114] width: 10mm  (center at 109)
  // Col 4: RATE (INR)  [114, 134] width: 20mm  (right at 132)
  // Col 5: TAXABLE     [134, 158] width: 24mm  (right at 156)
  // Col 6: GST (18%)   [158, 174] width: 16mm  (right at 172)
  // Col 7: TOTAL (INR) [174, 196] width: 22mm  (right at 194)
  // Sum of widths: 8 + 64 + 18 + 10 + 20 + 24 + 16 + 22 = 182mm
  // -------------------------------------------------------------
  const tableY = startY + 42;
  const thHeight = 8;
  const colSeparators = [22, 86, 104, 114, 134, 158, 174];

  // Table Header Background
  doc.setFillColor(...dark);
  doc.rect(margin, tableY, contentWidth, thHeight, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);

  doc.text('#', 18, tableY + 5.5, { align: 'center' });
  doc.text('DESCRIPTION OF GOODS', 24, tableY + 5.5, { align: 'left' });
  doc.text('HSN/SAC', 95, tableY + 5.5, { align: 'center' });
  doc.text('QTY', 109, tableY + 5.5, { align: 'center' });
  doc.text('RATE (INR)', 132, tableY + 5.5, { align: 'right' });
  doc.text('TAXABLE (INR)', 156, tableY + 5.5, { align: 'right' });
  doc.text('GST (18%)', 172, tableY + 5.5, { align: 'right' });
  doc.text('TOTAL (INR)', 194, tableY + 5.5, { align: 'right' });

  // Draw header column dividers in dark gray
  doc.setDrawColor(60, 60, 60);
  doc.setLineWidth(0.2);
  colSeparators.forEach((x) => {
    doc.line(x, tableY, x, tableY + thHeight);
  });

  // Rows Data
  let curY = tableY + thHeight;
  const items = data.items && data.items.length > 0
    ? data.items
    : [{ title: 'Custom Archival Photobook Keepsake', quantity: 1, price: data.total || 2499, dimensions: '8.25" × 8.25"', pageCount: 40 }];

  // Calculations
  const grandTotal = Number(data.total) || 2499;
  const taxableTotal = Math.round((grandTotal / 1.18) * 100) / 100;
  const gstTotal = Math.round((grandTotal - taxableTotal) * 100) / 100;
  const cgstAmount = isIntraState ? Math.round((gstTotal / 2) * 100) / 100 : 0;
  const sgstAmount = isIntraState ? Math.round((gstTotal - cgstAmount) * 100) / 100 : 0;
  const igstAmount = isIntraState ? 0 : gstTotal;

  items.forEach((item, index) => {
    const qty = Math.max(1, item.quantity || 1);
    const itemTotal = Number(item.price) || grandTotal;
    const itemTaxable = Math.round((itemTotal / 1.18) * 100) / 100;
    const itemGst = Math.round((itemTotal - itemTaxable) * 100) / 100;
    const unitRate = Math.round((itemTaxable / qty) * 100) / 100;

    // Wrap item title if long
    const titleLines: string[] = doc.splitTextToSize(item.title, 60);
    const rowH = Math.max(15, 6 + titleLines.length * 4 + 4);

    // Row zebra background
    doc.setFillColor(index % 2 === 0 ? 255 : 250, index % 2 === 0 ? 255 : 248, index % 2 === 0 ? 255 : 245);
    doc.rect(margin, curY, contentWidth, rowH, 'F');

    // Bottom row border
    doc.setDrawColor(...borderCol);
    doc.setLineWidth(0.3);
    doc.line(margin, curY + rowH, margin + contentWidth, curY + rowH);

    // Vertical column grid lines
    colSeparators.forEach((x) => {
      doc.line(x, curY, x, curY + rowH);
    });

    // Col 0: Index
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...dark);
    doc.text(`${index + 1}`, 18, curY + 6, { align: 'center' });

    // Col 1: Title & Specifications
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...dark);
    doc.text(titleLines, 24, curY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...gray);
    const subtitleY = curY + 5 + titleLines.length * 3.8;
    const isAccessory = item.pageCount === 0 || /box|ribbon|wrap|glaze|polaroid|print|keepsake/i.test(item.title);
    
    let itemSpecDesc = `180-Deg Layflat • ${item.dimensions || '8.25" × 8.25"'} • ${item.pageCount || 40} Pages Archival Matte`;
    let itemHsn = '4901 10 10';

    if (isAccessory) {
      if (/box/i.test(item.title)) {
        itemSpecDesc = 'Custom Archival Presentation Box • Gold Foil Insignia & Magnetic Ribbon';
        itemHsn = '4819 10 00';
      } else if (/ribbon|card|wrap/i.test(item.title)) {
        itemSpecDesc = 'Artisan Emerald Satin Ribbon • Personalized Calligraphy Card';
        itemHsn = '5806 32 00';
      } else if (/glaze|scratch/i.test(item.title)) {
        itemSpecDesc = 'Diamond Clear UV Glaze Micro-Coating • Fingerprint & Spill Protection';
        itemHsn = '3208 90 90';
      } else if (/polaroid|print/i.test(item.title)) {
        itemSpecDesc = '10 Mini Vintage Photo Prints (2"×3") • 300 GSM Archival Cotton';
        itemHsn = '4911 91 00';
      } else {
        itemSpecDesc = 'Archival Presentation Upgrade';
      }
    }

    doc.text(itemSpecDesc, 24, subtitleY);

    // Col 2: HSN
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...dark);
    doc.text(itemHsn, 95, curY + 6.5, { align: 'center' });

    // Col 3: QTY
    doc.text(`${qty}`, 109, curY + 6.5, { align: 'center' });

    // Col 4: RATE (INR)
    doc.text(formatNumber(unitRate), 132, curY + 6.5, { align: 'right' });

    // Col 5: TAXABLE (INR)
    doc.text(formatNumber(itemTaxable), 156, curY + 6.5, { align: 'right' });

    // Col 6: GST (18%)
    doc.text(formatNumber(itemGst), 172, curY + 6.5, { align: 'right' });

    // Col 7: TOTAL (INR)
    doc.setFont('helvetica', 'bold');
    doc.text(formatNumber(itemTotal), 194, curY + 6.5, { align: 'right' });

    curY += rowH;
  });

  // Outer border for table
  doc.setDrawColor(...borderCol);
  doc.setLineWidth(0.4);
  doc.rect(margin, tableY, contentWidth, curY - tableY, 'D');

  // -------------------------------------------------------------
  // 4. TAX SUMMARY & TOTALS BREAKDOWN
  // -------------------------------------------------------------
  const summaryY = curY + 5;
  const sumColW = 86;
  const sumX = margin + contentWidth - sumColW; // 110mm
  const noteW = contentWidth - sumColW - 4;    // 92mm

  // Right Box: Tax Summary
  doc.setFillColor(...lightBg);
  doc.rect(sumX, summaryY, sumColW, 46, 'F');
  doc.setDrawColor(...borderCol);
  doc.setLineWidth(0.3);
  doc.rect(sumX, summaryY, sumColW, 46, 'D');

  const addSumRow = (label: string, value: string, yPos: number, isBold = false) => {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(8);
    doc.setTextColor(isBold ? dark[0] : gray[0], isBold ? dark[1] : gray[1], isBold ? dark[2] : gray[2]);
    doc.text(label, sumX + 4, yPos);
    doc.text(value, sumX + sumColW - 4, yPos, { align: 'right' });
  };

  addSumRow('Taxable Subtotal (INR):', formatCurrency(taxableTotal), summaryY + 7);

  if (isIntraState) {
    addSumRow('CGST (9.0%):', formatCurrency(cgstAmount), summaryY + 14);
    addSumRow('SGST (9.0%):', formatCurrency(sgstAmount), summaryY + 21);
  } else {
    addSumRow('IGST (18.0%):', formatCurrency(igstAmount), summaryY + 14);
  }

  addSumRow('Shipping (BlueDart Air):', 'FREE (0.00)', summaryY + 28);

  // Total divider line
  doc.setDrawColor(...dark);
  doc.setLineWidth(0.5);
  doc.line(sumX, summaryY + 34, sumX + sumColW, summaryY + 34);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...dark);
  doc.text('TOTAL AMOUNT (INR):', sumX + 4, summaryY + 41);
  doc.text(formatCurrency(grandTotal), sumX + sumColW - 4, summaryY + 41, { align: 'right' });

  // Left Box: Total in Words & Bank Settlement Details
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
  doc.setFontSize(7.5);
  doc.setTextColor(...gray);
  const wordsLines = doc.splitTextToSize(numberToWords(grandTotal), noteW - 8);
  doc.text(wordsLines, margin + 4, summaryY + 11);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...dark);
  doc.text('SETTLEMENT & PAYMENT DETAILS', margin + 4, summaryY + 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...gray);
  doc.text('Bank: HDFC Bank Ltd. • Branch: Koramangala, Bengaluru', margin + 4, summaryY + 28);
  doc.text('A/C Name: PerfectPic Luxury Prints Pvt. Ltd.', margin + 4, summaryY + 32);
  doc.text('A/C No: 50200088921471  •  IFSC: HDFC0000053', margin + 4, summaryY + 36);
  doc.text('Payment Gateway Status: SUCCESS (PAID ONLINE - HDFC)', margin + 4, summaryY + 40);

  // -------------------------------------------------------------
  // 5. SIGNATURE & STATUTORY TERMS
  // -------------------------------------------------------------
  const termsY = summaryY + 52;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...dark);
  doc.text('TERMS & CONDITIONS', margin, termsY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...gray);
  doc.text('1. Goods once sold are backed by PerfectPic 7-Day Free Reprint Guarantee in case of transit or press damage.', margin, termsY + 4.5);
  doc.text('2. Layflat photobooks are manufactured according to ISO 9706 acid-free archival longevity standards.', margin, termsY + 8.5);
  doc.text('3. Disputes are subject to the exclusive jurisdiction of the competent courts in Bengaluru, Karnataka.', margin, termsY + 12.5);

  // Authorized Signatory Box (Right aligned)
  const sigX = margin + contentWidth - 65;
  doc.setDrawColor(...borderCol);
  doc.setLineWidth(0.3);
  doc.line(sigX, termsY + 14, margin + contentWidth, termsY + 14);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...dark);
  doc.text('For PERFECTPIC LUXURY PRINTS PVT. LTD.', sigX, termsY + 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...gray);
  doc.text('Authorized Digital Signatory', sigX, termsY + 22);
  doc.text('System Certified Document', sigX, termsY + 26);

  // Bottom Notice
  doc.setFontSize(6.5);
  doc.setTextColor(140, 140, 140);
  doc.text('This is a computer-generated tax invoice issued in accordance with Rule 46 of the CGST Rules, 2017.', pageWidth / 2, 285, { align: 'center' });

  // Trigger Download
  doc.save(`PerfectPic_GST_Invoice_${data.orderNumber}.pdf`);
}
