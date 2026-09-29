import { create } from 'zustand';

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
}

export type PageLayout = '1-photo' | '2-photo-v' | '2-photo-h' | '3-photo' | '4-photo';

export interface CoverConfig {
  title: string;
  subtitle: string;
  spineText: string;
  foilColor: 'gold' | 'silver' | 'rose-gold' | 'black';
  backgroundColor?: string;
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
  pageLayouts: Record<number, PageLayout>; // pageNumber -> PageLayout
  pageBackgrounds: Record<number, string>; // pageNumber -> Background color
  coverConfig: CoverConfig;

  photos: Photo[];
  photoFilter: 'all' | 'unused' | 'flagged';
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
  
  // Actions
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
  autoPopulatePages: () => void;
  clearPagePhoto: (pageNumber: number) => void;
  setPhotos: (photos: Photo[]) => void;
  addPhoto: (photo: Photo) => void;
  removePhoto: (id: string) => void;
  updatePageCanvas: (index: number, elements: any[]) => void;
  setPhotoFilter: (filter: 'all' | 'unused' | 'flagged') => void;
  setTemplate: (template: any) => void;
  setBookConfig: (config: Partial<EditorState['bookConfig']>) => void;
}

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
  pageLayouts: {},
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

  setPageCount: (count) => set((state) => ({
    pageCount: count,
    pages: generateSpreads(count),
    bookConfig: { ...state.bookConfig, pages: count }
  })),

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

    const newPagePhotos: Record<number, Photo> = {};
    // Page 0 = Cover
    if (state.photos[0]) {
      newPagePhotos[0] = state.photos[0];
    }

    // Pages 1 to pageCount (1 photo per page)
    for (let pageNum = 1; pageNum <= state.pageCount; pageNum++) {
      const photoIndex = pageNum % state.photos.length;
      if (state.photos[photoIndex]) {
        newPagePhotos[pageNum] = state.photos[photoIndex]!;
      }
    }

    const counts: Record<string, number> = {};
    Object.values(newPagePhotos).forEach(p => {
      if (p) counts[p.id] = (counts[p.id] || 0) + 1;
    });

    const updatedPhotos = state.photos.map(p => ({
      ...p,
      usedCount: counts[p.id] || 0
    }));

    return {
      pagePhotos: newPagePhotos,
      photos: updatedPhotos
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

  addPhoto: (photo) => set((state) => ({ photos: [...state.photos, photo] })),
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
  }))
}));
