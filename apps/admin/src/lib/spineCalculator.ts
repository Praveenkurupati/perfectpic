// apps/admin/src/lib/spineCalculator.ts

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
  isSpinePrintable: boolean;
}

export const BINDERY_SPECS = {
  PAPER_CALIPERS: {
    'matte-200': 0.22,
    'luster-250': 0.26,
    'pearl-300': 0.31,
  },
  BOARD_THICKNESS: {
    hardcover: 4.0,
    leather: 5.0,
    softcover: 1.0,
  },
  MIN_PRINTABLE_SPINE_MM: 5.5,
  CANVAS_PIXELS_PER_MM: 3.8,
};

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
  const spineWidthPx = Math.max(26, Math.min(76, Math.round(spineWidthMm * BINDERY_SPECS.CANVAS_PIXELS_PER_MM)));

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
