// apps/client/src/lib/pdfGenerator.ts
import { jsPDF } from 'jspdf';
import { getApiBaseUrl } from './urls';

export interface BookPdfOptions {
  title: string;
  subtitle?: string;
  seriesLabel?: string;
  dimensions?: string;
  pageCount?: number;
  theme?: string;
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
  spreads?: any[];
  projectId?: string;
}

/**
 * Converts a hex color string to RGB tuple.
 */
function hexToRgb(hex?: string, fallback: [number, number, number] = [250, 248, 245]): [number, number, number] {
  if (!hex || typeof hex !== 'string') return fallback;
  let c = hex.replace('#', '').trim();
  if (c.length === 3) {
    c = c.split('').map((x) => x + x).join('');
  }
  if (c.length !== 6) return fallback;
  const num = parseInt(c, 16);
  if (isNaN(num)) return fallback;
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/**
 * Returns RGB tuple for metallic foil simulation.
 */
function getFoilRgb(foilColor?: string): [number, number, number] {
  switch (foilColor) {
    case 'silver':
      return [200, 205, 215];
    case 'rose-gold':
      return [218, 150, 148];
    case 'black':
      return [26, 26, 26];
    case 'gold':
    default:
      return [212, 175, 55];
  }
}

/**
 * Returns human-readable layout label for spread headers.
 */
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
 * Safely fetches an image as a Blob with automatic fallback to the backend proxy.
 * This guarantees that CORS is never an issue, avoiding tainted canvas errors.
 */
async function fetchImageBlob(url: string): Promise<Blob | null> {
  if (!url || typeof window === 'undefined') return null;

  // If already a base64 data URL, convert to Blob directly
  if (url.startsWith('data:image/')) {
    try {
      const parts = url.split(',');
      const mime = parts[0]?.match(/:(.*?);/)?.[1] || 'image/jpeg';
      const b64 = parts[1] || '';
      const bstr = atob(b64);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], { type: mime });
    } catch {
      return null;
    }
  }

  // Attempt 1: Direct fetch with CORS mode
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (res.ok) {
      return await res.blob();
    }
  } catch {
    // Proceed to proxy fallback
  }

  // Attempt 2: Fetch via backend proxy endpoint (guarantees CORS from server)
  try {
    const proxyUrl = `${getApiBaseUrl()}/api/v1/upload/proxy?url=${encodeURIComponent(url)}`;
    const proxyRes = await fetch(proxyUrl);
    if (proxyRes.ok) {
      return await proxyRes.blob();
    }
  } catch {
    // Both failed
  }

  return null;
}

/**
 * Loads an HTMLImageElement safely from a URL using Object URLs whenever possible
 * to completely eliminate tainted canvas DOMExceptions.
 */
async function loadImageElement(url: string): Promise<{ img: HTMLImageElement; cleanup: () => void } | null> {
  if (!url || typeof window === 'undefined') return null;

  // 1. Try loading via Blob + ObjectURL (100% same-origin safety, no tainted canvas)
  const blob = await fetchImageBlob(url);
  if (blob) {
    return new Promise((resolve) => {
      const objectUrl = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        resolve({
          img,
          cleanup: () => URL.revokeObjectURL(objectUrl),
        });
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(null);
      };
      img.src = objectUrl;
    });
  }

  // 2. Direct Image fallback
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve({ img, cleanup: () => {} });
      img.onerror = () => resolve(null);
      img.src = url;
    } catch {
      resolve(null);
    }
  });
}

/**
 * Safely converts an image URL to a Base64 data URL.
 */
async function getBase64Image(url: string): Promise<string | null> {
  if (!url || typeof window === 'undefined') return null;
  if (url.startsWith('data:image/')) return url;

  // Attempt 1: Convert directly via Blob & FileReader
  const blob = await fetchImageBlob(url);
  if (blob) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  }

  // Attempt 2: Canvas draw fallback with Object URL safety
  const loaded = await loadImageElement(url);
  if (!loaded) return null;
  const { img, cleanup } = loaded;

  try {
    const canvas = document.createElement('canvas');
    canvas.width = Math.min(4200, img.naturalWidth || 1200);
    canvas.height = Math.min(4200, img.naturalHeight || 1200);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.96);
      cleanup();
      return dataUrl;
    }
  } catch {}

  cleanup();
  return null;
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

  const loaded = await loadImageElement(url);
  if (!loaded) return null;
  const { img, cleanup } = loaded;

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
      const dataUrl = canvas.toDataURL('image/jpeg', 0.96);
      cleanup();
      return dataUrl;
    }
  } catch (err) {
    console.warn('Canvas cropping error:', err);
  }

  cleanup();
  return null;
}

/**
 * Draws a single photo slot into the PDF with aspect-ratio preservation (zero squeeze).
 * If image fails or is unavailable, renders an archival placeholder plate.
 */
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
    } catch {
      // Fall through to placeholder plate
    }
  }

  // Museum Archival Photo Plate fallback
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

/**
 * Renders page slots according to the selected layout geometry.
 */
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
      // Full bleed across this 210mm x 210mm half page: ZERO margin, ZERO border, ZERO text
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
      await drawPhotoSlot(doc, url0, originX, originY, W, slotH, imageCache, `Page ${pageNum} Top`, false, getSlotCrop(pageNum, 0));
      await drawPhotoSlot(doc, url1, originX, originY + slotH + gap, W, slotH, imageCache, `Page ${pageNum} Bottom`, false, getSlotCrop(pageNum, 1));
      break;
    }

    case '2-photo-h': {
      const gap = 3.5;
      const slotW = (W - gap) / 2;
      const url0 = getSlotPhotoUrl(pageNum, 0);
      const url1 = getSlotPhotoUrl(pageNum, 1);
      await drawPhotoSlot(doc, url0, originX, originY, slotW, H, imageCache, `Page ${pageNum} Left`, false, getSlotCrop(pageNum, 0));
      await drawPhotoSlot(doc, url1, originX + slotW + gap, originY, slotW, H, imageCache, `Page ${pageNum} Right`, false, getSlotCrop(pageNum, 1));
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
      await drawPhotoSlot(doc, url0, originX, originY, heroW, H, imageCache, `Page ${pageNum} Hero`, false, getSlotCrop(pageNum, 0));
      await drawPhotoSlot(doc, url1, duoX, originY, heroW, duoH, imageCache, `Page ${pageNum} Top`, false, getSlotCrop(pageNum, 1));
      await drawPhotoSlot(doc, url2, duoX, originY + duoH + gap, heroW, duoH, imageCache, `Page ${pageNum} Bottom`, false, getSlotCrop(pageNum, 2));
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
          await drawPhotoSlot(doc, url, x, y, slotW, slotH, imageCache, `Page ${pageNum} Slot ${idx + 1}`, false, getSlotCrop(pageNum, idx));
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
          await drawPhotoSlot(doc, url, x, y, slotW, slotH, imageCache, `Page ${pageNum} Slot ${idx + 1}`, false, getSlotCrop(pageNum, idx));
        }
      }
      break;
    }

    case '1-photo':
    default: {
      const url = getSlotPhotoUrl(pageNum, 0);
      await drawPhotoSlot(doc, url, originX, originY, W, H, imageCache, `Page ${pageNum} Classic`, false, getSlotCrop(pageNum, 0));
      break;
    }
  }
}

/**
 * Builds a high-resolution, print-ready 3D Proof PDF document instance.
 * Format: 210mm x 210mm Square Lay-Flat Photobook (HP Indigo Press 12K Standard).
 * Inside spreads are rendered as true 420mm x 210mm continuous 180° layflat double-page spreads.
 */
export async function buildBookPdfDocument(options: BookPdfOptions): Promise<jsPDF> {
  const {
    title = 'Heirloom Custom Photobook',
    subtitle = 'Curated Monograph Edition',
    seriesLabel = 'THE TRAVEL SERIES',
    dimensions = '8.25" × 8.25"',
    pageCount = 32,
    theme = 'Minimal Modern',
    coverImage,
    coverColor = '#F8BAC7',
    coverConfig,
    photos = [],
    pagePhotos = {},
    slotPhotos = {},
    slotCrops = {},
    pageLayouts = {},
    pageBackgrounds = {},
    projectId = 'PP-PROOF',
  } = options;

  const imageCache = new Map<string, Promise<string | null>>();

  const displayTitle = coverConfig?.title || title;
  const displaySubtitle = coverConfig?.subtitle || subtitle;
  const foilColor = coverConfig?.foilColor || 'gold';
  const [foilR, foilG, foilB] = getFoilRgb(foilColor);
  const effectiveCoverBgHex = coverConfig?.backgroundColor || coverColor || '#1A1A1A';
  const [coverBgR, coverBgG, coverBgB] = hexToRgb(effectiveCoverBgHex, [26, 26, 26]);

  // Photo resolution helpers mirroring BookFlipPreview
  const getSlotPhotoUrl = (pageNum: number, subIndex: number): string => {
    const slotId = `${pageNum}_${subIndex}`;
    if (slotPhotos && slotPhotos[slotId]?.url) {
      return slotPhotos[slotId]!.url;
    }
    if (subIndex === 0 && pagePhotos && pagePhotos[pageNum]?.url) {
      return pagePhotos[pageNum]!.url;
    }
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
    if (slotPhotos && slotPhotos[spreadSlotId]?.url) {
      return slotPhotos[spreadSlotId]!.url;
    }
    if (slotPhotos && slotPhotos[`${leftPageNum}_0`]?.url) {
      return slotPhotos[`${leftPageNum}_0`]!.url;
    }
    if (pagePhotos && pagePhotos[leftPageNum]?.url) {
      return pagePhotos[leftPageNum]!.url;
    }
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

  const effectiveCoverUrl =
    slotPhotos['0']?.url ||
    pagePhotos[0]?.url ||
    coverImage ||
    photos[0] ||
    'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop';

  // Initialize Square 210mm x 210mm document for Front Cover
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [210, 210],
  });

  // ----------------------------------------------------------------------
  // PAGE 1: FRONT HARDCOVER PROOF
  // ----------------------------------------------------------------------
  doc.setFillColor(coverBgR, coverBgG, coverBgB);
  doc.rect(0, 0, 210, 210, 'F');

  // Left spine crease & 3D shadow simulation
  doc.setFillColor(0, 0, 0);
  doc.rect(0, 0, 8, 210, 'F');
  const isCoverLight = (coverBgR * 299 + coverBgG * 587 + coverBgB * 114) / 1000 > 160;
  doc.setDrawColor(isCoverLight ? 170 : 55, isCoverLight ? 170 : 55, isCoverLight ? 170 : 55);
  doc.setLineWidth(0.35);
  doc.line(8, 0, 8, 210);

  // Metallic foil embossed frame
  doc.setDrawColor(foilR, foilG, foilB);
  doc.setLineWidth(0.65);
  doc.rect(14, 12, 182, 186);

  // Header typography
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(isCoverLight ? 90 : 180, isCoverLight ? 90 : 180, isCoverLight ? 90 : 180);
  doc.text((seriesLabel || 'THE TRAVEL SERIES').toUpperCase(), 105, 22, { align: 'center' });

  doc.setFont('times', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(foilR, foilG, foilB);
  doc.text(displayTitle.toUpperCase(), 105, 30, { align: 'center' });

  doc.setFont('times', 'italic');
  doc.setFontSize(9.5);
  doc.setTextColor(isCoverLight ? 70 : 210, isCoverLight ? 70 : 210, isCoverLight ? 70 : 210);
  doc.text(displaySubtitle, 105, 36, { align: 'center' });

  // Center Archival Photo
  const coverImgX = 30;
  const coverImgY = 44;
  const coverImgW = 150;
  const coverImgH = 112;
  const coverCrop = slotCrops['0'] || slotCrops['cover'];
  await drawPhotoSlot(doc, effectiveCoverUrl, coverImgX, coverImgY, coverImgW, coverImgH, imageCache, displayTitle, false, coverCrop);

  // Specifications footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(isCoverLight ? 80 : 180, isCoverLight ? 80 : 180, isCoverLight ? 80 : 180);
  doc.text(`${pageCount} PAGES • ${dimensions} • THEME: ${theme.toUpperCase()}`, 105, 178, { align: 'center' });

  doc.setFontSize(7);
  doc.setTextColor(isCoverLight ? 110 : 150, isCoverLight ? 110 : 150, isCoverLight ? 110 : 150);
  doc.text('180° LAY-FLAT ARCHIVAL BINDING • ZERO GUTTER LOSS • 12K INDIGO PRESS', 105, 184, { align: 'center' });
  doc.text('CERTIFIED PAN-INDIA ARCHIVAL EDITION • WWW.PERFECTPIC.IN', 105, 189, { align: 'center' });

  // ----------------------------------------------------------------------
  // PAGES 2 to N: INSIDE SPREADS (TRUE 420mm × 210mm CONTINUOUS SPREADS)
  // ----------------------------------------------------------------------
  const totalSpreads = Math.ceil(pageCount / 2);

  for (let s = 1; s <= totalSpreads; s++) {
    // Add true 420mm x 210mm landscape spread
    doc.addPage([420, 210], 'landscape');

    const leftPageNum = (s - 1) * 2 + 1;
    const rightPageNum = leftPageNum + 1;

    const leftLayout = pageLayouts[leftPageNum] || '1-photo';
    const rightLayout = pageLayouts[rightPageNum] || '1-photo';
    const isPanoramic = leftLayout === '2-page-panoramic' || rightLayout === '2-page-panoramic';

    // Page Backgrounds
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
  // FINAL PAGE: BACK HARDCOVER & ARCHIVAL CERTIFICATION
  // ----------------------------------------------------------------------
  doc.addPage([210, 210], 'portrait');
  doc.setFillColor(coverBgR, coverBgG, coverBgB);
  doc.rect(0, 0, 210, 210, 'F');

  // Right spine crease & shadow simulation (for back cover)
  doc.setFillColor(0, 0, 0);
  doc.rect(202, 0, 8, 210, 'F');
  doc.setDrawColor(isCoverLight ? 170 : 55, isCoverLight ? 170 : 55, isCoverLight ? 170 : 55);
  doc.setLineWidth(0.35);
  doc.line(202, 0, 202, 210);

  // Debossed Gold Insignia frame
  doc.setDrawColor(foilR, foilG, foilB);
  doc.setLineWidth(0.65);
  doc.rect(14, 12, 182, 186);

  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(foilR, foilG, foilB);
  doc.text(displayTitle.toUpperCase(), 105, 45, { align: 'center' });

  doc.setDrawColor(foilR, foilG, foilB);
  doc.setLineWidth(0.3);
  doc.line(80, 51, 130, 51);

  doc.setFont('times', 'italic');
  doc.setFontSize(10);
  doc.setTextColor(isCoverLight ? 70 : 210, isCoverLight ? 70 : 210, isCoverLight ? 70 : 210);
  doc.text('“Every journey deserves a permanent place in print.”', 105, 59, { align: 'center' });

  // Archival Bindery Seal
  doc.setFont('times', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(isCoverLight ? 30 : 245, isCoverLight ? 30 : 245, isCoverLight ? 30 : 245);
  doc.text('PERFECTPIC ARCHIVAL PRESS', 105, 88, { align: 'center' });

  doc.setFont('times', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(foilR, foilG, foilB);
  doc.text('Fine Art Photobook Bindery • Made in India', 105, 95, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(isCoverLight ? 90 : 170, isCoverLight ? 90 : 170, isCoverLight ? 90 : 170);
  doc.text('ARCHIVAL GRADE PUR-MELT LAY-FLAT 180° BINDING', 105, 108, { align: 'center' });
  doc.text('ACID-FREE CERTIFIED 200 GSM HEAVYWEIGHT MATTE', 105, 114, { align: 'center' });
  doc.text('HP INDIGO 12000 DIGITAL PRESS • 100% ZERO GUTTER LOSS', 105, 120, { align: 'center' });
  doc.text('PAN-INDIA ZERO-DEFECT QUALITY GUARANTEE', 105, 126, { align: 'center' });

  // Print ISBN Barcode Box
  doc.setFillColor(255, 255, 255);
  doc.rect(105 - 25, 142, 50, 22, 'F');
  
  doc.setFillColor(0, 0, 0);
  for (let b = 0; b < 36; b++) {
    const barW = (b % 3 === 0) ? 1.4 : 0.7;
    doc.rect(105 - 22 + b * 1.2, 145, barW, 12, 'F');
  }
  doc.setFont('courier', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(0, 0, 0);
  const cleanProjId = (projectId || 'PROOF').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase();
  const serialNo = `PP-ISBN-${cleanProjId}-26`;
  doc.text(serialNo, 105, 161, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(isCoverLight ? 110 : 140, isCoverLight ? 110 : 140, isCoverLight ? 110 : 140);
  doc.text('Bengaluru • Mumbai • New Delhi • Hyderabad • Chennai', 105, 185, { align: 'center' });

  return doc;
}

/**
 * Generates and triggers browser download of the print-ready Photobook PDF.
 */
export async function generateBookProofPdf(options: BookPdfOptions): Promise<void> {
  const doc = await buildBookPdfDocument(options);
  const displayTitle = options.coverConfig?.title || options.title || 'Heirloom_Photobook';
  const cleanTitle = displayTitle.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`${cleanTitle}_12K_Print_Proof.pdf`);
}

/**
 * Generates the print-ready Photobook PDF as a binary Blob for direct cloud streaming to AWS S3.
 */
export async function generateBookPdfBlob(options: BookPdfOptions): Promise<Blob> {
  const doc = await buildBookPdfDocument(options);
  return doc.output('blob');
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
