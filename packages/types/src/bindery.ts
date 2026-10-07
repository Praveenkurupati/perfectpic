// packages/types/src/bindery.ts

export type BinderyCoverType = 'hardcover' | 'leather' | 'softcover';
export type PaperType = 'matte-200' | 'luster-250' | 'pearl-300';
export type FoilColor = 'gold' | 'silver' | 'rose-gold' | 'black';

export interface SpineMetrics {
  pageCount: number;
  sheetCount: number;
  coverType: BinderyCoverType;
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

export interface BleedSpecs {
  bleedMarginMm: number;      // 3.0mm exterior print bleed
  safeZoneMarginMm: number;   // 5.0mm interior safety margin
  dpi: number;                // 300 DPI commercial press standard
  cmykProfile: string;        // ISO Coated v2 / Fogra39 standard
}

export const BINDERY_SPECS = {
  // Caliper per leaf (thickness in millimeters for double-sided sheet)
  PAPER_CALIPERS: {
    'matte-200': 0.22, // 200 GSM Heavyweight Matte
    'luster-250': 0.26, // 250 GSM Premium Lustre Silk
    'pearl-300': 0.31, // 300 GSM Archival Pearl Fine Art
  } as Record<PaperType, number>,
  
  // Cover board thickness + hinge wrap allowance (millimeters)
  BOARD_THICKNESS: {
    hardcover: 4.0, // 2.5mm Board + 1.5mm hinge wrap
    leather: 5.0,   // 3.0mm Bonded Leather Wrap + hinge
    softcover: 1.0, // 350 GSM Art Card Wrap
  } as Record<BinderyCoverType, number>,

  // Exterior bleed and interior safety margins
  PRESS_SPECS: {
    bleedMarginMm: 3.0,
    safeZoneMarginMm: 5.0,
    dpi: 300,
    cmykProfile: 'FOGRA39',
  } as BleedSpecs,

  MIN_PRINTABLE_SPINE_MM: 5.5,
  CANVAS_PIXELS_PER_MM: 3.8,
};

/**
 * Calculates exact spine thickness in millimeters.
 * Spine (mm) = ((PageCount / 2) * PaperCaliper) + BoardThickness
 */
export function calculateSpineWidthMm(
  pageCount: number,
  coverType: BinderyCoverType = 'hardcover',
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
 * Computes complete bindery metrics for editorial display and pre-flight rasterization.
 */
export function getSpineMetrics(
  pageCount: number,
  coverType: BinderyCoverType = 'hardcover',
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
