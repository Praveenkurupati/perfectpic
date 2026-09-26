import { create } from 'zustand';

interface Page {
  id: string;
  type: 'cover' | 'spread' | 'back';
  layout: string;
  elements: any[];
}

interface Photo {
  id: string;
  url: string;
  usedCount: number;
  flagged: boolean;
}

interface EditorState {
  canvas: any | null; // Placeholder for fabric.Canvas
  selectedObjectId: string | null;
  history: string[];
  historyIndex: number;
  pages: Page[];
  currentPageIndex: number;
  photos: Photo[];
  photoFilter: 'all' | 'unused' | 'flagged';
  bookConfig: {
    size: string;
    coverType: string;
    theme: string;
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
  addPhoto: (photo: Photo) => void;
  removePhoto: (id: string) => void;
  updatePageCanvas: (index: number, elements: any[]) => void;
  setPhotoFilter: (filter: 'all' | 'unused' | 'flagged') => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  canvas: null,
  selectedObjectId: null,
  history: [],
  historyIndex: -1,
  pages: [
    { id: 'cover', type: 'cover', layout: 'full', elements: [] },
    { id: 'spread-1', type: 'spread', layout: '2-photo', elements: [] },
    { id: 'back', type: 'back', layout: 'full', elements: [] },
  ],
  currentPageIndex: 0,
  photos: [],
  photoFilter: 'all',
  bookConfig: {
    size: '8x8',
    coverType: 'hardcover',
    theme: 'classic',
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
      // insert before back cover
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
  setCurrentPage: (index) => set({ currentPageIndex: index }),
  addPhoto: (photo) => set((state) => ({ photos: [...state.photos, photo] })),
  removePhoto: (id) => set((state) => ({ photos: state.photos.filter(p => p.id !== id) })),
  updatePageCanvas: (index, elements) => set((state) => {
    const page = state.pages[index];
    if (!page) return state;
    const newPages = [...state.pages];
    newPages[index] = { ...page, elements };
    return { pages: newPages };
  }),
  setPhotoFilter: (filter) => set({ photoFilter: filter })
}));
