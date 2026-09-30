// apps/client/src/lib/spineCalculator.ts

export type CoverType = 'hardcover' | 'leather' | 'softcover';
export type PaperType = 'matte-200' | 'luster-250' | 'pearl-300';

export interface SpineMetrics {
  pageCount: number;
  sheetCount: number;
  coverType: CoverType;
  paperType: PaperType;
  paperCaliperMm: number;
  boardThicknessMm: number;
  bookBlockMm: number;
  spineWidthMm: number;
  spineWidthInches: number;
  spineWidthPx: number;
  recommendedFontSizePt: number;
  isSpinePrintable: boolean; // Spine width >= 6mm can safely take embossed lettering
}

/**
 * Technical bindery constants for archival layflat photobooks.
 * In 180° lay-flat binding, 2 pages constitute 1 continuous double-sided leaf/sheet.
 */
export const BINDERY_SPECS = {
  // Caliper per leaf (thickness in millimeters)
  PAPER_CALIPERS: {
    'matte-200': 0.22, // 200 GSM Archival Heavyweight Matte
    'luster-250': 0.26, // 250 GSM Premium Lustre Silk
    'pearl-300': 0.31, // 300 GSM Archival Pearl Fine Art
  },
  // Cover board thickness + hinge wrap allowance (millimeters)
  BOARD_THICKNESS: {
    hardcover: 4.0, // 2.5mm Greyboard + 1.5mm hinge wrap allowance
    leather: 5.0, // 3.0mm Luxury Bonded Leather Wrap + hinge
    softcover: 1.0, // 350 GSM Art Card Wrap
  },
  MIN_PRINTABLE_SPINE_MM: 5.5, // Minimum spine thickness to emboss readable typography
  CANVAS_PIXELS_PER_MM: 3.8, // Conversion factor for responsive studio canvas display
};

/**
 * Calculates exact spine thickness in millimeters based on the page count,
 * paper stock caliper, and cover board allowance.
 *
 * Formula:
 * Spine (mm) = ((PageCount / 2) * PaperCaliper) + BoardThickness
 */
export function calculateSpineWidthMm(
  pageCount: number,
  coverType: CoverType = 'hardcover',
  paperType: PaperType = 'matte-200'
): number {
  const safePages = Math.max(12, pageCount);
  const sheetCount = Math.ceil(safePages / 2);
  const caliper = BINDERY_SPECS.PAPER_CALIPERS[paperType] || 0.22;
  const board = BINDERY_SPECS.BOARD_THICKNESS[coverType] || 4.0;
  
  const rawSpine = (sheetCount * caliper) + board;
  return Math.round(rawSpine * 10) / 10;
}

/**
 * Calculates responsive pixel width for Studio Canvas representation.
 */
export function calculateSpineWidthPx(
  pageCount: number,
  coverType: CoverType = 'hardcover',
  paperType: PaperType = 'matte-200',
  scaleMultiplier: number = 1.0
): number {
  const spineMm = calculateSpineWidthMm(pageCount, coverType, paperType);
  // Clamp between 24px and 72px for optimal UI canvas layout
  const rawPx = spineMm * BINDERY_SPECS.CANVAS_PIXELS_PER_MM * scaleMultiplier;
  return Math.max(26, Math.min(76, Math.round(rawPx)));
}

/**
 * Returns comprehensive bindery metrics for display in Studio Canvas,
 * Editor Toolbar, and production pre-flight checks.
 */
export function getSpineMetrics(
  pageCount: number,
  coverType: CoverType = 'hardcover',
  paperType: PaperType = 'matte-200'
): SpineMetrics {
  const safePages = Math.max(12, pageCount);
  const sheetCount = Math.ceil(safePages / 2);
  const paperCaliperMm = BINDERY_SPECS.PAPER_CALIPERS[paperType] || 0.22;
  const boardThicknessMm = BINDERY_SPECS.BOARD_THICKNESS[coverType] || 4.0;
  
  const bookBlockMm = Math.round(sheetCount * paperCaliperMm * 10) / 10;
  const spineWidthMm = Math.round((bookBlockMm + boardThicknessMm) * 10) / 10;
  const spineWidthInches = Math.round((spineWidthMm / 25.4) * 100) / 100;
  const spineWidthPx = calculateSpineWidthPx(pageCount, coverType, paperType);

  // Font size scaling: smaller spines (<8mm) use 7-8pt, thicker books use 9-11pt
  let recommendedFontSizePt = 8;
  if (spineWidthMm >= 14) recommendedFontSizePt = 11;
  else if (spineWidthMm >= 10) recommendedFontSizePt = 9.5;
  else if (spineWidthMm >= 7.5) recommendedFontSizePt = 8.5;
  else recommendedFontSizePt = 7;

  return {
    pageCount: safePages,
    sheetCount,
    coverType,
    paperType,
    paperCaliperMm,
    boardThicknessMm,
    bookBlockMm,
    spineWidthMm,
    spineWidthInches,
    spineWidthPx,
    recommendedFontSizePt,
    isSpinePrintable: spineWidthMm >= BINDERY_SPECS.MIN_PRINTABLE_SPINE_MM,
  };
}
