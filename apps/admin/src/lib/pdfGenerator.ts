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
  coverColor?: string;
  coverConfig?: {
    title?: string;
    subtitle?: string;
    spineText?: string;
    foilColor?: 'gold' | 'silver' | 'rose-gold' | 'black';
    backgroundColor?: string;
  };
  photos?: string[];
  pagePhotos?: Record<number, { url: string } | null>;
  slotPhotos?: Record<string, { url: string } | null>;
  slotCrops?: Record<string, { position?: string; x?: number; y?: number; zoom?: number }>;
  pageLayouts?: Record<number, string>;
  pageBackgrounds?: Record<number, string>;
  dueDate?: string;
}

function hexToRgb(hex?: string, fallback: [number, number, number] = [250, 248, 245]): [number, number, number] {
  if (!hex || typeof hex !== 'string') return fallback;
  let c = hex.replace('#', '').trim();
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  if (c.length !== 6) return fallback;
  const num = parseInt(c, 16);
  if (isNaN(num)) return fallback;
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function getFoilRgb(foilColor?: string): [number, number, number] {
  switch (foilColor) {
    case 'silver': return [200, 205, 215];
    case 'rose-gold': return [218, 150, 148];
    case 'black': return [26, 26, 26];
    case 'gold':
    default: return [212, 175, 55];
  }
}

function getLayoutDisplayName(layout: string): string {
  switch (layout) {
    case '1-photo-full': return 'Full Bleed';
    case '2-photo-v': return 'Stacked Duo';
    case '2-photo-h': return 'Side-by-Side';
    case '3-photo': return 'Hero + Duo';
    case '4-photo': return '2×2 Grid';
    case '6-photo-grid': return '3×2 Grid';
    case '2-page-panoramic': return 'Panoramic Spread';
    case '1-photo':
    default: return 'Classic Gallery';
  }
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
          canvas.width = Math.min(4200, img.naturalWidth || 1200);
          canvas.height = Math.min(4200, img.naturalHeight || 1200);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/jpeg', 0.96));
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
 * Proportionally pre-crops an image to exactly match target slot dimensions.
 * Eliminates distortion / squeezing and respects user focal point and zoom.
 */
async function getCroppedBase64Image(
  url: string,
  targetW: number,
  targetH: number,
  crop?: { position?: string; x?: number; y?: number; zoom?: number }
): Promise<string | null> {
  if (!url || typeof window === 'undefined') return null;

  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          const naturalW = img.naturalWidth || 800;
          const naturalH = img.naturalHeight || 800;
          const targetAspect = targetW / targetH;
          const imgAspect = naturalW / naturalH;

          const zoom = Math.max(1, Math.min(3, crop?.zoom ?? 1.0));
          const focalX = Math.max(0, Math.min(100, crop?.x ?? 50)) / 100;
          const focalY = Math.max(0, Math.min(100, crop?.y ?? 50)) / 100;

          let cropW: number;
          let cropH: number;

          if (imgAspect > targetAspect) {
            // Image is wider than slot: limit by height, crop horizontal sides
            cropH = naturalH / zoom;
            cropW = cropH * targetAspect;
          } else {
            // Image is taller than slot: limit by width, crop vertical top/bottom
            cropW = naturalW / zoom;
            cropH = cropW / targetAspect;
          }

          cropW = Math.min(naturalW, cropW);
          cropH = Math.min(naturalH, cropH);

          const maxSourceX = naturalW - cropW;
          const maxSourceY = naturalH - cropH;
          const sourceX = Math.max(0, Math.min(maxSourceX, maxSourceX * focalX));
          const sourceY = Math.max(0, Math.min(maxSourceY, maxSourceY * focalY));

          // Set canvas output resolution for ultra-HD 300-DPI archival print
          const canvasW = Math.max(1200, Math.min(4200, Math.round(cropW)));
          const canvasH = Math.round(canvasW / targetAspect);

          const canvas = document.createElement('canvas');
          canvas.width = canvasW;
          canvas.height = canvasH;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, sourceX, sourceY, cropW, cropH, 0, 0, canvasW, canvasH);
            resolve(canvas.toDataURL('image/jpeg', 0.96));
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

async function drawPhotoSlot(
  doc: jsPDF,
  url: string,
  x: number,
  y: number,
  w: number,
  h: number,
  imageCache: Map<string, Promise<string | null>>,
  label?: string,
  noBorder?: boolean,
  crop?: { position?: string; x?: number; y?: number; zoom?: number }
): Promise<void> {
  let base64: string | null = null;
  if (url) {
    const cacheKey = `${url}_${Math.round(w * 10)}x${Math.round(h * 10)}_${crop?.x ?? 50}_${crop?.y ?? 50}_${crop?.zoom ?? 1}`;
    if (!imageCache.has(cacheKey)) {
      imageCache.set(
        cacheKey,
        getCroppedBase64Image(url, w, h, crop).then(async (cropped) => {
          if (cropped) return cropped;
          return getBase64Image(url);
        })
      );
    }
    base64 = await imageCache.get(cacheKey)!;
  }

  if (base64) {
    try {
      const format = base64.startsWith('data:image/png') ? 'PNG' : 'JPEG';
      doc.addImage(base64, format, x, y, w, h, undefined, 'SLOW');
      if (!noBorder) {
        doc.setDrawColor(215, 210, 200);
        doc.setLineWidth(0.25);
        doc.rect(x, y, w, h);
      }
      return;
    } catch {}
  }

  // Placeholder
  doc.setFillColor(242, 239, 234);
  doc.rect(x, y, w, h, 'F');
  if (!noBorder) {
    doc.setDrawColor(210, 205, 195);
    doc.setLineWidth(0.25);
    doc.rect(x, y, w, h);
  }

  if (label) {
    doc.setFont('times', 'italic');
    doc.setFontSize(Math.max(6, Math.min(8.5, Math.round(w / 14))));
    doc.setTextColor(140, 135, 130);
    doc.text(label, x + w / 2, y + h / 2, { align: 'center' });
  }
}

async function drawPageLayoutSlots(
  doc: jsPDF,
  pageNum: number,
  layout: string,
  originX: number,
  originY: number,
  W: number,
  H: number,
  isRightPage: boolean,
  getSlotPhotoUrl: (pageNum: number, subIndex: number) => string,
  getSlotCrop: (pageNum: number, subIndex: number) => { position?: string; x?: number; y?: number; zoom?: number } | undefined,
  imageCache: Map<string, Promise<string | null>>
): Promise<void> {
  switch (layout) {
    case '1-photo-full': {
      const x = isRightPage ? 210 : 0;
      const y = 0;
      const w = 210;
      const h = 210;
      const url = getSlotPhotoUrl(pageNum, 0);
      await drawPhotoSlot(doc, url, x, y, w, h, imageCache, undefined, true, getSlotCrop(pageNum, 0));
      break;
    }

    case '2-photo-v': {
      const gap = 3.5;
      const slotH = (H - gap) / 2;
      const url0 = getSlotPhotoUrl(pageNum, 0);
      const url1 = getSlotPhotoUrl(pageNum, 1);
      await drawPhotoSlot(doc, url0, originX, originY, W, slotH, imageCache, `P.${pageNum} Top`, false, getSlotCrop(pageNum, 0));
      await drawPhotoSlot(doc, url1, originX, originY + slotH + gap, W, slotH, imageCache, `P.${pageNum} Bottom`, false, getSlotCrop(pageNum, 1));
      break;
    }

    case '2-photo-h': {
      const gap = 3.5;
      const slotW = (W - gap) / 2;
      const url0 = getSlotPhotoUrl(pageNum, 0);
      const url1 = getSlotPhotoUrl(pageNum, 1);
      await drawPhotoSlot(doc, url0, originX, originY, slotW, H, imageCache, `P.${pageNum} Left`, false, getSlotCrop(pageNum, 0));
      await drawPhotoSlot(doc, url1, originX + slotW + gap, originY, slotW, H, imageCache, `P.${pageNum} Right`, false, getSlotCrop(pageNum, 1));
      break;
    }

    case '3-photo': {
      const gap = 3.5;
      const heroW = (W - gap) / 2;
      const duoH = (H - gap) / 2;
      const duoX = originX + heroW + gap;
      const url0 = getSlotPhotoUrl(pageNum, 0);
      const url1 = getSlotPhotoUrl(pageNum, 1);
      const url2 = getSlotPhotoUrl(pageNum, 2);
      await drawPhotoSlot(doc, url0, originX, originY, heroW, H, imageCache, `P.${pageNum} Hero`, false, getSlotCrop(pageNum, 0));
      await drawPhotoSlot(doc, url1, duoX, originY, heroW, duoH, imageCache, `P.${pageNum} Top`, false, getSlotCrop(pageNum, 1));
      await drawPhotoSlot(doc, url2, duoX, originY + duoH + gap, heroW, duoH, imageCache, `P.${pageNum} Bottom`, false, getSlotCrop(pageNum, 2));
      break;
    }

    case '4-photo': {
      const gap = 3.5;
      const slotW = (W - gap) / 2;
      const slotH = (H - gap) / 2;
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 2; c++) {
          const idx = r * 2 + c;
          const x = originX + c * (slotW + gap);
          const y = originY + r * (slotH + gap);
          const url = getSlotPhotoUrl(pageNum, idx);
          await drawPhotoSlot(doc, url, x, y, slotW, slotH, imageCache, `P.${pageNum} #${idx + 1}`, false, getSlotCrop(pageNum, idx));
        }
      }
      break;
    }

    case '6-photo-grid': {
      const gapX = 3;
      const gapY = 3;
      const slotW = (W - 2 * gapX) / 3;
      const slotH = (H - gapY) / 2;
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 3; c++) {
          const idx = r * 3 + c;
          const x = originX + c * (slotW + gapX);
          const y = originY + r * (slotH + gapY);
          const url = getSlotPhotoUrl(pageNum, idx);
          await drawPhotoSlot(doc, url, x, y, slotW, slotH, imageCache, `P.${pageNum} #${idx + 1}`, false, getSlotCrop(pageNum, idx));
        }
      }
      break;
    }

    case '1-photo':
    default: {
      const url = getSlotPhotoUrl(pageNum, 0);
      await drawPhotoSlot(doc, url, originX, originY, W, H, imageCache, `P.${pageNum} Classic`, false, getSlotCrop(pageNum, 0));
      break;
    }
  }
}

/**
 * Generates an HP Indigo Production Print Run PDF for admin bindery queue.
 * Covers Front Plate + True 420mm × 210mm Layflat Spreads + Back Cover.
 */
export async function generateAdminProductionPdf(options: AdminPrintPdfOptions): Promise<void> {
  const {
    orderNumber,
    title,
    customerName = 'Customer',
    dimensions = '8.25" × 8.25"',
    pages = 40,
    coverImage,
    coverColor = '#1A1A1A',
    coverConfig,
    photos = [],
    pagePhotos = {},
    slotPhotos = {},
    slotCrops = {},
    pageLayouts = {},
    pageBackgrounds = {},
    dueDate = 'Immediate',
  } = options;

  const imageCache = new Map<string, Promise<string | null>>();

  const displayTitle = coverConfig?.title || title;
  const displaySubtitle = coverConfig?.subtitle || 'Curated Monograph Edition';
  const foilColor = coverConfig?.foilColor || 'gold';
  const [foilR, foilG, foilB] = getFoilRgb(foilColor);
  const effectiveCoverBgHex = coverConfig?.backgroundColor || coverColor || '#1A1A1A';
  const [coverBgR, coverBgG, coverBgB] = hexToRgb(effectiveCoverBgHex, [26, 26, 26]);

  const getSlotPhotoUrl = (pageNum: number, subIndex: number): string => {
    const slotId = `${pageNum}_${subIndex}`;
    if (slotPhotos && slotPhotos[slotId]?.url) return slotPhotos[slotId]!.url;
    if (subIndex === 0 && pagePhotos && pagePhotos[pageNum]?.url) return pagePhotos[pageNum]!.url;
    if (photos && photos.length > 0) {
      const idx = (pageNum * 3 + subIndex) % photos.length;
      return photos[idx] || photos[0]!;
    }
    return 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop';
  };

  const getSlotCrop = (pageNum: number, subIndex: number) => {
    const slotId = `${pageNum}_${subIndex}`;
    if (slotCrops && slotCrops[slotId]) return slotCrops[slotId];
    if (subIndex === 0 && slotCrops && slotCrops[String(pageNum)]) return slotCrops[String(pageNum)];
    return undefined;
  };

  const getPanoramicPhotoUrl = (spreadIndex: number, leftPageNum: number): string => {
    const spreadSlotId = `spread_${spreadIndex}`;
    if (slotPhotos && slotPhotos[spreadSlotId]?.url) return slotPhotos[spreadSlotId]!.url;
    if (slotPhotos && slotPhotos[`${leftPageNum}_0`]?.url) return slotPhotos[`${leftPageNum}_0`]!.url;
    if (pagePhotos && pagePhotos[leftPageNum]?.url) return pagePhotos[leftPageNum]!.url;
    if (photos && photos.length > 0) {
      const idx = (spreadIndex - 1) % photos.length;
      return photos[idx] || photos[0]!;
    }
    return 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600&auto=format&fit=crop';
  };

  const getPanoramicCrop = (spreadIndex: number, leftPageNum: number) => {
    const spreadSlotId = `spread_${spreadIndex}`;
    if (slotCrops && slotCrops[spreadSlotId]) return slotCrops[spreadSlotId];
    if (slotCrops && slotCrops[`${leftPageNum}_0`]) return slotCrops[`${leftPageNum}_0`];
    if (slotCrops && slotCrops[String(leftPageNum)]) return slotCrops[String(leftPageNum)];
    return undefined;
  };

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
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text(`[PRODUCTION PRINT RUN] JOB #${orderNumber}`, 15, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(212, 175, 55);
  doc.text(`HP INDIGO 12000 DIGITAL PRESS • 12-COLOR CMYK + LIGHT CYAN + LIGHT MAGENTA`, 15, 24);

  // Ticket specifications table
  doc.setFillColor(28, 28, 28);
  doc.roundedRect(15, 28, width - 30, 42, 2, 2, 'F');

  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(220, 220, 220);
  doc.text(`PROJECT TITLE : ${displayTitle.toUpperCase()}`, 20, 36);
  doc.text(`CUSTOMER NAME : ${customerName.toUpperCase()}`, 20, 42);
  doc.text(`PAGE COUNT    : ${pages} PAGES (${Math.ceil(pages / 2)} SPREADS)`, 20, 48);
  doc.text(`DIMENSIONS    : ${dimensions}`, 20, 54);
  doc.text(`BINDING TYPE  : PUR-MELT 180° LAY-FLAT WITH ZERO GUTTER LOSS`, 20, 60);
  doc.text(`TARGET DUE    : ${dueDate.toUpperCase()}`, width - 75, 36);
  doc.text(`FOIL STAMP    : ${foilColor.toUpperCase()} METALLIC EMBOSS`, width - 75, 42);

  // CMYK Color calibration control strip
  const swatches = ['#000000', '#009ee0', '#e5007d', '#ffed00', '#009640', '#e30613', '#662483', '#d4af37'];
  swatches.forEach((sw, i) => {
    doc.setFillColor(sw);
    doc.rect(15 + i * 22.5, 73, 20, 5, 'F');
  });

  // Cover Image Plate
  const coverUrl =
    slotPhotos['0']?.url ||
    pagePhotos[0]?.url ||
    coverImage ||
    photos[0] ||
    'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop';

  const imgX = 25;
  const imgY = 82;
  const imgW = 160;
  const imgH = 105;
  const coverCrop = slotCrops['0'] || slotCrops['cover'];
  await drawPhotoSlot(doc, coverUrl, imgX, imgY, imgW, imgH, imageCache, 'Cover Plate High Resolution', false, coverCrop);

  // Footer Job Barcode
  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text(`PERFECTPIC AUTOMATED BINDERY PIPELINE • BATCH TRACE: ${orderNumber}-INDIGO-12K`, width / 2, 200, { align: 'center' });

  // ----------------------------------------------------------------------
  // INSIDE SPREAD PAGES (TRUE 420mm × 210mm CONTINUOUS SPREADS)
  // ----------------------------------------------------------------------
  const totalSpreads = Math.ceil(pages / 2);

  for (let s = 1; s <= totalSpreads; s++) {
    doc.addPage([420, 210], 'landscape');

    const leftPageNum = (s - 1) * 2 + 1;
    const rightPageNum = leftPageNum + 1;

    const leftLayout = pageLayouts[leftPageNum] || '1-photo';
    const rightLayout = pageLayouts[rightPageNum] || '1-photo';
    const isPanoramic = leftLayout === '2-page-panoramic' || rightLayout === '2-page-panoramic';

    const [lR, lG, lB] = hexToRgb(pageBackgrounds[leftPageNum], [250, 248, 245]);
    const [rR, rG, rB] = hexToRgb(pageBackgrounds[rightPageNum], [250, 248, 245]);

    doc.setFillColor(lR, lG, lB);
    doc.rect(0, 0, 210, 210, 'F');

    doc.setFillColor(rR, rG, rB);
    doc.rect(210, 0, 210, 210, 'F');

    // 180° Center layflat seam score line
    doc.setDrawColor(215, 210, 200);
    doc.setLineWidth(0.25);
    doc.line(210, 0, 210, 210);

    if (isPanoramic) {
      // -------------------------------------------------------------
      // TWO PAGES FULL IMAGE: ZERO MARGIN, ZERO TEXT, ZERO PAGE NUMBERS
      // -------------------------------------------------------------
      const panoUrl = getPanoramicPhotoUrl(s, leftPageNum);
      const panoCrop = getPanoramicCrop(s, leftPageNum);
      await drawPhotoSlot(doc, panoUrl, 0, 0, 420, 210, imageCache, undefined, true, panoCrop);
    } else {
      // -------------------------------------------------------------
      // SEPARATE PAGES: MULTI-PHOTO EDITORIAL LAYOUTS
      // 40% DECREASED MARGINS: Outer from 18mm -> 11mm, Spine/Top from 16mm -> 10mm
      // Expanded content area: 189mm x 186mm
      // -------------------------------------------------------------
      const originY = 10;
      const W = 189;
      const H = 186;

      // Draw subtle center fold guide ONLY if neither page is full bleed
      if (leftLayout !== '1-photo-full' && rightLayout !== '1-photo-full') {
        doc.setDrawColor(225, 220, 210);
        doc.setLineWidth(0.2);
        doc.line(210, 10, 210, 200);
      }

      // Draw Left Page Layout Slots (originX = 11mm, outer margin = 11mm, spine margin = 10mm)
      await drawPageLayoutSlots(
        doc,
        leftPageNum,
        leftLayout,
        11,
        originY,
        W,
        H,
        false,
        getSlotPhotoUrl,
        getSlotCrop,
        imageCache
      );

      // ONLY give page number if margin is there (NOT full bleed)
      if (leftLayout !== '1-photo-full') {
        doc.setFont('times', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(110, 110, 110);
        doc.text(String(leftPageNum), 11, 203);
      }

      // Draw Right Page Layout Slots (originX = 220mm, spine margin = 10mm, outer margin = 11mm)
      await drawPageLayoutSlots(
        doc,
        rightPageNum,
        rightLayout,
        220,
        originY,
        W,
        H,
        true,
        getSlotPhotoUrl,
        getSlotCrop,
        imageCache
      );

      // ONLY give page number if margin is there (NOT full bleed)
      if (rightLayout !== '1-photo-full') {
        doc.setFont('times', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(110, 110, 110);
        doc.text(String(rightPageNum), 409, 203, { align: 'right' });
      }
    }
  }

  // ----------------------------------------------------------------------
  // BACK COVER
  // ----------------------------------------------------------------------
  doc.addPage([210, 210], 'portrait');
  doc.setFillColor(coverBgR, coverBgG, coverBgB);
  doc.rect(0, 0, 210, 210, 'F');

  doc.setDrawColor(foilR, foilG, foilB);
  doc.setLineWidth(0.6);
  doc.rect(14, 12, 182, 186);

  doc.setFont('times', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(foilR, foilG, foilB);
  doc.text(displayTitle.toUpperCase(), 105, 75, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(200, 200, 200);
  doc.text('HP INDIGO 12000 DIGITAL PRESS • ARCHIVAL PUR-MELT LAY-FLAT BINDING', 105, 88, { align: 'center' });
  doc.text(`ORDER NO: ${orderNumber} • BENGALURU BINDERY FACILITY`, 105, 95, { align: 'center' });

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
