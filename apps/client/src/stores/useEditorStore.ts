import { create } from 'zustand';
import { indexedDbStorage } from '@/lib/storage/indexedDbStorage';
import { calculateEffectiveSlotDpi } from '@/lib/imageQualityAnalyzer';
import { BurstCluster, detectBurstAndDuplicateGroups } from '@/lib/burstPhotoDetector';

export interface Page {
  id: string;
  type: 'cover' | 'spread' | 'back';
  layout: string;
  elements: any[];
}

export interface Photo {
  id: string;
  url: string;
  usedCount: number;
  flagged: boolean;
  name?: string;
  width?: number;
  height?: number;
  blurScore?: number;
  isBlurry?: boolean;
  isLowRes?: boolean;
  qualityGrade?: 'A+' | 'A' | 'B' | 'C' | 'D';
  summary?: string;
  recommendedLayout?: string;
  dHash?: string;
  burstGroupId?: string;
  isBestPick?: boolean;
  isDuplicateOrBurst?: boolean;
  isExcludedFromAutofill?: boolean;
}

export interface FlaggedSlotIssue {
  slotId: string;
  pageNum: number;
  photo: Photo;
  effectiveDpi: number;
  isBlurry: boolean;
  reason: string;
  suggestion: string;
}

export interface PreflightAuditReport {
  pass: boolean;
  totalPlaced: number;
  ultraHdCount: number;
  goodCount: number;
  fairCount: number;
  lowResCount: number;
  blurryCount: number;
  flaggedIssues: FlaggedSlotIssue[];
}

export type PageLayout = 
  | '1-photo' 
  | '1-photo-full' 
  | '2-page-panoramic' 
  | '2-photo-v' 
  | '2-photo-h' 
  | '3-photo' 
  | '3-photo-h'
  | '4-photo' 
  | '6-photo-grid';

export interface CoverConfig {
  title: string;
  subtitle: string;
  spineText: string;
  foilColor: 'gold' | 'silver' | 'rose-gold' | 'black';
  backgroundColor?: string;
}

export type PhotoCropPosition =
  | 'center'
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'custom';

export interface SlotCropConfig {
  position: PhotoCropPosition;
  x: number; // 0 to 100% (default 50)
  y: number; // 0 to 100% (default 50)
  zoom: number; // 1.0 to 3.0 (default 1.0)
}

interface EditorState {
  canvas: any | null;
  selectedObjectId: string | null;
  history: string[];
  historyIndex: number;
  pages: Page[];
  currentPageIndex: number;
  
  // Dynamic page count (12, 24, 32 default, 60, 120)
  pageCount: number;
  currentSpreadIndex: number; // 0 = Cover, 1 = Spreads 1-2, etc.
  selectedSlot: string | null; // e.g. "1" or "1_0" or "1_1"
  pagePhotos: Record<number, Photo | null>; // legacy page number -> Photo
  slotPhotos: Record<string, Photo | null>; // slotId -> Photo
  slotCrops: Record<string, SlotCropConfig>; // slotId -> SlotCropConfig
  pageLayouts: Record<number, PageLayout>; // pageNumber -> PageLayout
  pageBackgrounds: Record<number, string>; // pageNumber -> Background color
  coverConfig: CoverConfig;

  photos: Photo[];
  photoFilter: 'all' | 'unique' | 'bursts' | 'unused' | 'flagged';
  burstGroups: BurstCluster[];
  isDetectingBursts: boolean;
  template: any | null;
  bookConfig: {
    size: string;
    coverType: string;
    theme: string;
    color?: string;
    packaging?: string;
    pages?: number;
    price?: number;
  };
  autoSaveStatus: 'saved' | 'saving' | 'error';
  currentProjectId: string | null;
  
  // Actions
  initProject: (projectId: string, initialConfig?: any) => void;
  resetProject: (projectId?: string) => void;
  setCanvas: (canvas: any) => void;
  setSelectedObject: (id: string | null) => void;
  pushHistory: (stateJson: string) => void;
  undo: () => void;
  redo: () => void;
  addPage: (page: Page, index?: number) => void;
  removePage: (index: number) => void;
  reorderPages: (fromIndex: number, toIndex: number) => void;
  setCurrentPage: (index: number) => void;
  setPageCount: (count: number) => void;
  setCurrentSpreadIndex: (index: number) => void;
  setSelectedSlot: (slot: string | number | null) => void;
  setPageLayout: (pageNumber: number, layout: PageLayout) => void;
  setPageBackground: (pageNumber: number, color: string) => void;
  updateCoverConfig: (config: Partial<CoverConfig>) => void;
  assignPhotoToSlot: (slotId: string, photo: Photo | null) => void;
  assignPhotoToPage: (pageNumber: number, photo: Photo | null) => void;
  setSlotCrop: (slotId: string, crop: Partial<SlotCropConfig>) => void;
  autoPopulatePages: () => void;
  clearPagePhoto: (pageNumber: number) => void;
  setPhotos: (photos: Photo[]) => void;
  addPhoto: (photo: Photo) => void;
  removePhoto: (id: string) => void;
  updatePageCanvas: (index: number, elements: any[]) => void;
  captions: Record<number, string>;
  captionCase: 'lower' | 'sentence' | 'upper';
  canvasZoom: number;
  activeSidebarTab: 'photos' | 'layouts' | 'text' | 'background' | 'cover';
  setCaption: (pageNumber: number, caption: string) => void;
  setCaptionCase: (c: 'lower' | 'sentence' | 'upper') => void;
  setCanvasZoom: (zoom: number | ((prev: number) => number)) => void;
  setActiveSidebarTab: (tab: 'photos' | 'layouts' | 'text' | 'background' | 'cover') => void;
  addSpread: () => void;
  toggleSlotFit: (slotId: string) => void;
  rotateSlotPhoto: (slotId: string) => void;
  setPhotoFilter: (filter: 'all' | 'unique' | 'bursts' | 'unused' | 'flagged') => void;
  setTemplate: (template: any) => void;
  setBookConfig: (config: Partial<EditorState['bookConfig']>) => void;
  updatePhotoQuality: (photoId: string, quality: Partial<Photo>) => void;
  getPreflightAudit: () => PreflightAuditReport;
  detectBurstPhotos: () => Promise<BurstCluster[]>;
  keepOnlyBestPicks: () => void;
  togglePhotoExclusion: (photoId: string) => void;
  setPhotoAsBestPick: (clusterId: string, photoId: string) => void;
}

/**
 * Calculates minimum required photos dynamically based on selected page count.
 * E.g., a 32-page edition requires at least 28 photos to ensure full layout coverage.
 */
export const getMinPhotosRequired = (pages: number): number => {
  const p = Number(pages) || 32;
  if (p <= 12) return Math.max(6, p - 2);
  if (p <= 24) return Math.max(16, p - 4);
  if (p === 32) return 28;
  if (p === 50) return 42;
  if (p === 60) return 50;
  if (p === 72) return 60;
  if (p === 120) return 100;
  return Math.max(8, Math.round(p * 0.85));
};

// Generate default spreads matching page count
const generateSpreads = (pageCount: number): Page[] => {
  const spreads: Page[] = [
    { id: 'cover', type: 'cover', layout: 'full', elements: [] }
  ];
  const numSpreads = Math.ceil(pageCount / 2);
  for (let i = 1; i <= numSpreads; i++) {
    spreads.push({
      id: `spread-${i}`,
      type: 'spread',
      layout: 'single-photo-per-page',
      elements: []
    });
  }
  spreads.push({ id: 'back', type: 'back', layout: 'full', elements: [] });
  return spreads;
};

export const generateDefaultPageLayouts = (pageCount: number): Record<number, PageLayout> => {
  const layouts: Record<number, PageLayout> = {};
  for (let i = 1; i <= pageCount; i++) {
    layouts[i] = '1-photo';
  }
  return layouts;
};

export const useEditorStore = create<EditorState>((set, get) => ({
  canvas: null,
  selectedObjectId: null,
  history: [],
  historyIndex: -1,
  pageCount: 32, // Default 32 pages as requested
  currentSpreadIndex: 1, // Start on first spread (Pages 1 & 2)
  selectedSlot: '1', // Default focus on Page 1
  pagePhotos: {},
  slotPhotos: {},
  slotCrops: {},
  pageLayouts: generateDefaultPageLayouts(32),
  pageBackgrounds: {},
  coverConfig: {
    title: 'PERFECTPIC',
    subtitle: 'Keepsake Edition 2026',
    spineText: 'PERFECTPIC',
    foilColor: 'gold',
  },
  pages: generateSpreads(32),
  currentPageIndex: 1,
  photos: [],
  photoFilter: 'all',
  burstGroups: [],
  isDetectingBursts: false,
  template: null,
  bookConfig: {
    size: '8.25x8.25',
    coverType: 'cov-1',
    theme: 'theme-1',
    color: 'col-1',
    packaging: 'pack-1',
    pages: 32,
    price: 1999
  },
  autoSaveStatus: 'saved',
  currentProjectId: null,
  captions: {},
  captionCase: 'lower',
  canvasZoom: 100,
  activeSidebarTab: 'layouts',

  setCaption: (pageNumber, caption) => set((state) => ({
    captions: { ...state.captions, [pageNumber]: caption },
    autoSaveStatus: 'saved',
  })),
  setCaptionCase: (c) => set({ captionCase: c }),
  setCanvasZoom: (zoom) => set((state) => ({
    canvasZoom: typeof zoom === 'function' ? zoom(state.canvasZoom) : Math.max(50, Math.min(200, zoom)),
  })),
  setActiveSidebarTab: (tab) => set({ activeSidebarTab: tab }),
  addSpread: () => set((state) => {
    const newCount = state.pageCount + 2;
    return {
      pageCount: newCount,
      pages: generateSpreads(newCount),
      bookConfig: { ...state.bookConfig, pages: newCount },
    };
  }),
  toggleSlotFit: (slotId) => set((state) => {
    const existing = state.slotCrops[slotId] || { position: 'center', x: 50, y: 50, zoom: 1 };
    const newZoom = existing.zoom > 1.05 ? 1.0 : 1.35;
    return {
      slotCrops: {
        ...state.slotCrops,
        [slotId]: { ...existing, zoom: newZoom },
      },
      autoSaveStatus: 'saved',
    };
  }),
  rotateSlotPhoto: (slotId) => set((state) => {
    const existing = state.slotCrops[slotId] || { position: 'center', x: 50, y: 50, zoom: 1 };
    const positions: SlotCropConfig['position'][] = ['center', 'top', 'right', 'bottom', 'left'];
    const curIdx = positions.indexOf(existing.position);
    const nextPos = positions[(curIdx + 1) % positions.length] || 'center';
    return {
      slotCrops: {
        ...state.slotCrops,
        [slotId]: { ...existing, position: nextPos },
      },
      autoSaveStatus: 'saved',
    };
  }),

  setCanvas: (canvas) => set({ canvas }),
  setSelectedObject: (id) => set({ selectedObjectId: id }),
  pushHistory: (stateJson) => set((state) => {
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(stateJson);
    return { history: newHistory, historyIndex: newHistory.length - 1, autoSaveStatus: 'saving' };
  }),
  undo: () => set((state) => {
    if (state.historyIndex > 0) {
      return { historyIndex: state.historyIndex - 1 };
    }
    return state;
  }),
  redo: () => set((state) => {
    if (state.historyIndex < state.history.length - 1) {
      return { historyIndex: state.historyIndex + 1 };
    }
    return state;
  }),
  addPage: (page, index) => set((state) => {
    const newPages = [...state.pages];
    if (index !== undefined) {
      newPages.splice(index, 0, page);
    } else {
      newPages.splice(newPages.length - 1, 0, page);
    }
    return { pages: newPages };
  }),
  removePage: (index) => set((state) => {
    const newPages = [...state.pages];
    newPages.splice(index, 1);
    return { pages: newPages };
  }),
  reorderPages: (fromIndex, toIndex) => set((state) => {
    const newPages = [...state.pages];
    const [moved] = newPages.splice(fromIndex, 1);
    if (moved) {
      newPages.splice(toIndex, 0, moved);
    }
    return { pages: newPages };
  }),
  setCurrentPage: (index) => set({ currentPageIndex: index, currentSpreadIndex: index }),

  setPageCount: (count) => set((state) => {
    const nextLayouts = { ...generateDefaultPageLayouts(count), ...state.pageLayouts };
    return {
      pageCount: count,
      pages: generateSpreads(count),
      pageLayouts: nextLayouts,
      bookConfig: { ...state.bookConfig, pages: count }
    };
  }),

  setCurrentSpreadIndex: (index) => set({
    currentSpreadIndex: index,
    currentPageIndex: index,
    selectedSlot: index === 0 ? '0' : ((index - 1) * 2 + 1).toString()
  }),

  setSelectedSlot: (slot) => set({ selectedSlot: slot !== null ? slot.toString() : null }),

  setPageLayout: (pageNumber, layout) => set((state) => ({
    pageLayouts: { ...state.pageLayouts, [pageNumber]: layout },
    autoSaveStatus: 'saved',
  })),

  setPageBackground: (pageNumber, color) => set((state) => ({
    pageBackgrounds: { ...state.pageBackgrounds, [pageNumber]: color },
    autoSaveStatus: 'saved',
  })),

  updateCoverConfig: (config) => set((state) => ({
    coverConfig: { ...state.coverConfig, ...config },
    autoSaveStatus: 'saved',
  })),

  assignPhotoToSlot: (slotId, photo) => set((state) => {
    const updatedSlotPhotos = { ...state.slotPhotos };
    if (photo) {
      updatedSlotPhotos[slotId] = photo;
    } else {
      delete updatedSlotPhotos[slotId];
    }

    const updatedPagePhotos = { ...state.pagePhotos };
    const num = parseInt(slotId, 10);
    if (!isNaN(num) && !slotId.includes('_')) {
      if (photo) updatedPagePhotos[num] = photo;
      else delete updatedPagePhotos[num];
    }

    const counts: Record<string, number> = {};
    Object.values(updatedSlotPhotos).forEach(p => {
      if (p) counts[p.id] = (counts[p.id] || 0) + 1;
    });

    const updatedPhotos = state.photos.map(p => ({
      ...p,
      usedCount: counts[p.id] || 0
    }));

    return {
      slotPhotos: updatedSlotPhotos,
      pagePhotos: updatedPagePhotos,
      photos: updatedPhotos,
      autoSaveStatus: 'saved'
    };
  }),

  assignPhotoToPage: (pageNumber, photo) => {
    get().assignPhotoToSlot(pageNumber.toString(), photo);
  },

  setSlotCrop: (slotId, crop) => set((state) => {
    const existing = state.slotCrops[slotId] || { position: 'center', x: 50, y: 50, zoom: 1 };
    return {
      slotCrops: {
        ...state.slotCrops,
        [slotId]: {
          ...existing,
          ...crop,
          // Constrain coordinates and zoom
          x: crop.x !== undefined ? Math.max(0, Math.min(100, Math.round(crop.x))) : existing.x,
          y: crop.y !== undefined ? Math.max(0, Math.min(100, Math.round(crop.y))) : existing.y,
          zoom: crop.zoom !== undefined ? Math.max(1, Math.min(3, Math.round(crop.zoom * 100) / 100)) : existing.zoom,
        },
      },
      autoSaveStatus: 'saved',
    };
  }),

  clearPagePhoto: (pageNumber) => set((state) => {
    const updatedPagePhotos = { ...state.pagePhotos };
    delete updatedPagePhotos[pageNumber];

    const counts: Record<string, number> = {};
    Object.values(updatedPagePhotos).forEach(p => {
      if (p) counts[p.id] = (counts[p.id] || 0) + 1;
    });

    const updatedPhotos = state.photos.map(p => ({
      ...p,
      usedCount: counts[p.id] || 0
    }));

    return {
      pagePhotos: updatedPagePhotos,
      photos: updatedPhotos
    };
  }),

  autoPopulatePages: () => set((state) => {
    if (state.photos.length === 0) return state;

    // Intelligent pool: prioritize unique photos and burst best picks
    const cleanCandidates = state.photos.filter(
      (p) => !p.isExcludedFromAutofill && (!p.isDuplicateOrBurst || p.isBestPick)
    );
    const pool = cleanCandidates.length > 0 ? cleanCandidates : state.photos;

    const newPagePhotos: Record<number, Photo> = {};
    const newSlotPhotos: Record<string, Photo> = {};
    const newPageLayouts: Record<number, PageLayout> = {};

    // Page 0 = Cover
    if (pool[0]) {
      newPagePhotos[0] = pool[0];
      newSlotPhotos['0'] = pool[0];
    }

    // Pages 1 to pageCount: 1 photo per page, layout strictly '1-photo'
    for (let pageNum = 1; pageNum <= state.pageCount; pageNum++) {
      newPageLayouts[pageNum] = '1-photo';
      const photoIndex = (pageNum - 1) % pool.length;
      const photo = pool[photoIndex];
      if (photo) {
        newPagePhotos[pageNum] = photo;
        newSlotPhotos[pageNum.toString()] = photo;
        newSlotPhotos[`${pageNum}_0`] = photo;
      }
    }

    const counts: Record<string, number> = {};
    Object.values(newSlotPhotos).forEach(p => {
      if (p) counts[p.id] = (counts[p.id] || 0) + 1;
    });

    const updatedPhotos = state.photos.map(p => ({
      ...p,
      usedCount: counts[p.id] || 0
    }));

    return {
      pagePhotos: newPagePhotos,
      slotPhotos: newSlotPhotos,
      pageLayouts: newPageLayouts,
      photos: updatedPhotos,
      autoSaveStatus: 'saved'
    };
  }),

  setPhotos: (photos) => {
    set({ photos });
    // If pages are empty and we just set photos, auto-populate initial pages
    const state = get();
    if (Object.keys(state.pagePhotos).length === 0 && photos.length > 0) {
      state.autoPopulatePages();
    }
  },

  addPhoto: (photo) => {
    if (typeof window !== 'undefined' && photo.url && photo.url.startsWith('data:')) {
      fetch(photo.url)
        .then((res) => res.blob())
        .then((blob) => indexedDbStorage.storePhotoBlob(photo.id, blob, photo.name))
        .then((objectUrl) => {
          set((state) => ({
            photos: state.photos.map((p) => (p.id === photo.id ? { ...p, url: objectUrl } : p)),
          }));
        })
        .catch(() => {});
    }
    set((state) => ({ photos: [...state.photos, photo] }));
  },
  removePhoto: (id) => set((state) => ({ photos: state.photos.filter(p => p.id !== id) })),
  updatePageCanvas: (index, elements) => set((state) => {
    const page = state.pages[index];
    if (!page) return state;
    const newPages = [...state.pages];
    newPages[index] = { ...page, elements };
    return { pages: newPages };
  }),
  setPhotoFilter: (filter) => set({ photoFilter: filter }),
  setTemplate: (template) => set({ template }),
  setBookConfig: (config) => set((state) => ({
    bookConfig: { ...state.bookConfig, ...config }
  })),

  updatePhotoQuality: (photoId, quality) => set((state) => ({
    photos: state.photos.map((p) => (p.id === photoId ? { ...p, ...quality } : p)),
    slotPhotos: Object.fromEntries(
      Object.entries(state.slotPhotos).map(([k, p]) => [
        k,
        p && p.id === photoId ? { ...p, ...quality } : p,
      ])
    ),
    pagePhotos: Object.fromEntries(
      Object.entries(state.pagePhotos).map(([k, p]) => [
        k,
        p && p.id === photoId ? { ...p, ...quality } : p,
      ])
    ),
  })),

  getPreflightAudit: () => {
    const state = get();
    const flaggedIssues: FlaggedSlotIssue[] = [];
    let ultraHdCount = 0;
    let goodCount = 0;
    let fairCount = 0;
    let lowResCount = 0;
    let blurryCount = 0;

    const totalPages = state.pageCount || 32;
    const evaluatedSlots = new Set<string>();

    // 1. Check Front Cover Slot '0'
    const coverPhoto = state.slotPhotos['0'] || state.pagePhotos[0];
    if (coverPhoto) {
      evaluatedSlots.add('0');
      const crop = state.slotCrops['0'] || { position: 'center', x: 50, y: 50, zoom: 1 };
      const report = calculateEffectiveSlotDpi(
        coverPhoto.width || 2000,
        coverPhoto.height || 2000,
        state.bookConfig.size,
        1,
        crop.zoom,
        !!coverPhoto.isBlurry
      );

      if (report.isUltraHD) ultraHdCount++;
      else if (report.isGood) goodCount++;
      else if (report.isFair) fairCount++;
      else lowResCount++;

      if (coverPhoto.isBlurry) blurryCount++;

      if (report.hasQualityWarning) {
        flaggedIssues.push({
          slotId: '0',
          pageNum: 0,
          photo: coverPhoto,
          effectiveDpi: report.effectiveDpi,
          isBlurry: !!coverPhoto.isBlurry,
          reason: report.warningReason || 'Front Cover Quality Warning',
          suggestion: report.suggestion || 'Use a higher resolution photo for the front cover.',
        });
      }
    }

    // 2. Check All Pages 1 to totalPages
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const layout = state.pageLayouts[pageNum] || '1-photo';

      // Panoramic spread
      if (layout === '2-page-panoramic') {
        const spreadIdx = Math.ceil(pageNum / 2);
        const slotId = `spread_${spreadIdx}`;
        if (!evaluatedSlots.has(slotId)) {
          evaluatedSlots.add(slotId);
          const p = state.slotPhotos[slotId] || state.slotPhotos[`${pageNum}_0`] || state.pagePhotos[pageNum];
          if (p) {
            const crop = state.slotCrops[slotId] || state.slotCrops[`${pageNum}_0`] || { position: 'center', x: 50, y: 50, zoom: 1 };
            const report = calculateEffectiveSlotDpi(
              p.width || 2000,
              p.height || 2000,
              state.bookConfig.size,
              2,
              crop.zoom,
              !!p.isBlurry
            );

            if (report.isUltraHD) ultraHdCount++;
            else if (report.isGood) goodCount++;
            else if (report.isFair) fairCount++;
            else lowResCount++;

            if (p.isBlurry) blurryCount++;

            if (report.hasQualityWarning) {
              flaggedIssues.push({
                slotId,
                pageNum,
                photo: p,
                effectiveDpi: report.effectiveDpi,
                isBlurry: !!p.isBlurry,
                reason: report.warningReason || 'Panoramic Spread Quality Warning',
                suggestion: report.suggestion || 'Panoramic spreads require high resolution for crisp 300 DPI.',
              });
            }
          }
        }
        continue;
      }

      // Other standard layouts
      let slotKeys: { slotId: string; fraction: number }[] = [];
      if (layout === '1-photo-full' || layout === '1-photo') {
        slotKeys = [{ slotId: `${pageNum}`, fraction: 1 }];
      } else if (layout === '2-photo-v') {
        slotKeys = [
          { slotId: `${pageNum}_0`, fraction: 1 },
          { slotId: `${pageNum}_1`, fraction: 1 },
        ];
      } else if (layout === '2-photo-h') {
        slotKeys = [
          { slotId: `${pageNum}_0`, fraction: 0.5 },
          { slotId: `${pageNum}_1`, fraction: 0.5 },
        ];
      } else if (layout === '3-photo' || layout === '3-photo-h') {
        slotKeys = [
          { slotId: `${pageNum}_0`, fraction: layout === '3-photo-h' ? 1 : 0.5 },
          { slotId: `${pageNum}_1`, fraction: 0.5 },
          { slotId: `${pageNum}_2`, fraction: 0.5 },
        ];
      } else if (layout === '4-photo') {
        slotKeys = [0, 1, 2, 3].map((i) => ({ slotId: `${pageNum}_${i}`, fraction: 0.5 }));
      } else if (layout === '6-photo-grid') {
        slotKeys = [0, 1, 2, 3, 4, 5].map((i) => ({ slotId: `${pageNum}_${i}`, fraction: 0.33 }));
      }

      for (const { slotId, fraction } of slotKeys) {
        evaluatedSlots.add(slotId);
        const p = state.slotPhotos[slotId] || (slotId === `${pageNum}` ? state.pagePhotos[pageNum] : null);
        if (p) {
          const crop = state.slotCrops[slotId] || { position: 'center', x: 50, y: 50, zoom: 1 };
          const report = calculateEffectiveSlotDpi(
            p.width || 2000,
            p.height || 2000,
            state.bookConfig.size,
            fraction,
            crop.zoom,
            !!p.isBlurry
          );

          if (report.isUltraHD) ultraHdCount++;
          else if (report.isGood) goodCount++;
          else if (report.isFair) fairCount++;
          else lowResCount++;

          if (p.isBlurry) blurryCount++;

          if (report.hasQualityWarning) {
            flaggedIssues.push({
              slotId,
              pageNum,
              photo: p,
              effectiveDpi: report.effectiveDpi,
              isBlurry: !!p.isBlurry,
              reason: report.warningReason || 'Slot Quality Warning',
              suggestion: report.suggestion || 'Consider placing in a smaller grid or replacing with a higher-res photo.',
            });
          }
        }
      }
    }

    const totalPlaced = ultraHdCount + goodCount + fairCount + lowResCount;
    const pass = lowResCount === 0 && blurryCount === 0;

    return {
      pass,
      totalPlaced,
      ultraHdCount,
      goodCount,
      fairCount,
      lowResCount,
      blurryCount,
      flaggedIssues,
    };
  },

  detectBurstPhotos: async () => {
    const state = get();
    if (state.photos.length < 2) return [];
    set({ isDetectingBursts: true });
    try {
      const clusters = await detectBurstAndDuplicateGroups(state.photos);
      const bestPickIds = new Set(clusters.map((c) => c.bestPickPhotoId));
      const burstGroupMap = new Map<string, string>();
      clusters.forEach((c) => {
        c.photoIds.forEach((id) => burstGroupMap.set(id, c.clusterId));
      });

      const updatedPhotos = state.photos.map((p) => {
        const clusterId = burstGroupMap.get(p.id);
        if (!clusterId) {
          return {
            ...p,
            burstGroupId: undefined,
            isBestPick: undefined,
            isDuplicateOrBurst: false,
            isExcludedFromAutofill: false,
          };
        }
        const isBest = bestPickIds.has(p.id);
        return {
          ...p,
          burstGroupId: clusterId,
          isBestPick: isBest,
          isDuplicateOrBurst: !isBest,
          isExcludedFromAutofill: !isBest,
        };
      });

      set({
        photos: updatedPhotos,
        burstGroups: clusters,
        isDetectingBursts: false,
      });
      return clusters;
    } catch (err) {
      console.error('Failed to detect burst photos:', err);
      set({ isDetectingBursts: false });
      return [];
    }
  },

  keepOnlyBestPicks: () => {
    const state = get();
    const updatedPhotos = state.photos.map((p) => {
      if (p.burstGroupId && !p.isBestPick) {
        return { ...p, isExcludedFromAutofill: true };
      }
      return { ...p, isExcludedFromAutofill: false };
    });
    set({ photos: updatedPhotos });
    get().autoPopulatePages();
  },

  togglePhotoExclusion: (photoId: string) =>
    set((state) => ({
      photos: state.photos.map((p) =>
        p.id === photoId ? { ...p, isExcludedFromAutofill: !p.isExcludedFromAutofill } : p
      ),
    })),

  setPhotoAsBestPick: (clusterId: string, photoId: string) =>
    set((state) => {
      const updatedPhotos = state.photos.map((p) => {
        if (p.burstGroupId === clusterId) {
          const isThis = p.id === photoId;
          return {
            ...p,
            isBestPick: isThis,
            isDuplicateOrBurst: !isThis,
            isExcludedFromAutofill: !isThis,
          };
        }
        return p;
      });
      const updatedClusters = state.burstGroups.map((c) => {
        if (c.clusterId === clusterId) {
          return { ...c, bestPickPhotoId: photoId };
        }
        return c;
      });
      return { photos: updatedPhotos, burstGroups: updatedClusters };
    }),

  initProject: (projectId: string, initialConfig?: any) => {
    const currentId = get().currentProjectId;
    // If project is already initialized with this exact ID, keep existing state and sync page count if needed
    if (currentId === projectId) {
      if (initialConfig?.pages && initialConfig.pages !== get().pageCount) {
        get().setPageCount(initialConfig.pages);
      }
      return;
    }

    // Check IndexedDB asynchronously for robust full project storage
    if (typeof window !== 'undefined') {
      indexedDbStorage.getProjectSnapshot(projectId).then((dbSnapshot) => {
        if (dbSnapshot && dbSnapshot.photos && dbSnapshot.photos.length > 0) {
          set({
            photos: dbSnapshot.photos,
            slotPhotos: dbSnapshot.slotPhotos || {},
            slotCrops: dbSnapshot.slotCrops || {},
            pagePhotos: dbSnapshot.pagePhotos || {},
          });
        }
      }).catch(() => {});
    }

    // Attempt to hydrate from saved localStorage snapshot for this project
    let snapshot: any = null;
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(`pp_snapshot_${projectId}`);
        if (raw) snapshot = JSON.parse(raw);
      } catch (err) {
        console.warn('Failed to parse project snapshot:', err);
      }
    }

    if (snapshot) {
      const pCount = snapshot.pageCount || initialConfig?.pages || 32;
      const defaultLayouts = generateDefaultPageLayouts(pCount);
      const resolvedLayouts = { ...defaultLayouts, ...(snapshot.pageLayouts || {}) };
      set({
        currentProjectId: projectId,
        pageCount: pCount,
        pages: generateSpreads(pCount),
        currentSpreadIndex: 1,
        selectedSlot: '1',
        photos: Array.isArray(snapshot.photos)
          ? snapshot.photos.map((p: any, idx: number) =>
              typeof p === 'string'
                ? { id: `photo-${idx}`, url: p, usedCount: 0, flagged: false }
                : p
            )
          : [],
        pagePhotos: snapshot.pagePhotos || {},
        slotPhotos: snapshot.slotPhotos || {},
        slotCrops: snapshot.slotCrops || {},
        pageLayouts: resolvedLayouts,
        pageBackgrounds: snapshot.pageBackgrounds || {},
        coverConfig: snapshot.coverConfig || {
          title: snapshot.title || 'PERFECTPIC',
          subtitle: snapshot.subtitle || 'Keepsake Edition 2026',
          spineText: 'PERFECTPIC',
          foilColor: 'gold',
        },
        bookConfig: {
          size: snapshot.dimensions || initialConfig?.size || '8.25x8.25',
          coverType: snapshot.bookConfig?.coverType || initialConfig?.coverType || 'cov-1',
          theme: snapshot.theme || initialConfig?.theme || 'theme-1',
          color: snapshot.coverColor || initialConfig?.color || 'col-1',
          packaging: snapshot.bookConfig?.packaging || initialConfig?.packaging || 'pack-1',
          pages: pCount,
          price: snapshot.bookConfig?.price || initialConfig?.price || 1999,
        },
        autoSaveStatus: 'saved',
      });
    } else {
      // New project: completely wipe photos, slot assignments, and crops
      const pCount = initialConfig?.pages || 32;
      set({
        currentProjectId: projectId,
        pageCount: pCount,
        pages: generateSpreads(pCount),
        currentSpreadIndex: 1,
        selectedSlot: '1',
        photos: [],
        pagePhotos: {},
        slotPhotos: {},
        slotCrops: {},
        pageLayouts: generateDefaultPageLayouts(pCount),
        pageBackgrounds: {},
        coverConfig: {
          title: 'PERFECTPIC',
          subtitle: 'Keepsake Edition 2026',
          spineText: 'PERFECTPIC',
          foilColor: 'gold',
        },
        bookConfig: {
          size: initialConfig?.size || '8.25x8.25',
          coverType: initialConfig?.coverType || 'cov-1',
          theme: initialConfig?.theme || 'theme-1',
          color: initialConfig?.color || 'col-1',
          packaging: initialConfig?.packaging || 'pack-1',
          pages: pCount,
          price: initialConfig?.price || 1999,
        },
        autoSaveStatus: 'saved',
      });
    }
  },

  resetProject: (projectId?: string) => {
    if (typeof window !== 'undefined' && projectId) {
      try {
        localStorage.removeItem(`pp_snapshot_${projectId}`);
        indexedDbStorage.deleteProjectSnapshot(projectId).catch(() => {});
      } catch {}
    }
    const pageCount = 32;
    set({
      currentProjectId: null,
      pageCount,
      pages: generateSpreads(pageCount),
      currentSpreadIndex: 1,
      selectedSlot: '1',
      photos: [],
      pagePhotos: {},
      slotPhotos: {},
      slotCrops: {},
      pageLayouts: generateDefaultPageLayouts(pageCount),
      pageBackgrounds: {},
      coverConfig: {
        title: 'PERFECTPIC',
        subtitle: 'Keepsake Edition 2026',
        spineText: 'PERFECTPIC',
        foilColor: 'gold',
      },
      autoSaveStatus: 'saved',
    });
  }
}));
