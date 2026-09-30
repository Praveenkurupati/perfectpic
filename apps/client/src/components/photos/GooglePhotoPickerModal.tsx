'use client';

import { useState, useMemo } from 'react';
import { 
  X, 
  Check, 
  CheckCircle2, 
  Image as ImageIcon, 
  Folder, 
  FolderOpen, 
  Search, 
  Calendar, 
  Sparkles, 
  Loader2, 
  CheckSquare, 
  Square, 
  ExternalLink,
  Info,
  Layers,
  ArrowRight,
  HardDrive
} from 'lucide-react';
import { useEditorStore } from '@/stores/useEditorStore';

export function GoogleLogo({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export function GoogleDriveLogo({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 87.3 78" fill="none">
      <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066DA"/>
      <path d="M43.65 25 29.9 1.2C28.55 2 27.4 3.1 26.6 4.5L1.2 48.55c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00AC47"/>
      <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.85 10.15z" fill="#EA4335"/>
      <path d="M43.65 25 57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.4-4.5 1.2z" fill="#00832D"/>
      <path d="M59.8 53H87.3c0-1.55-.4-3.1-1.2-4.5L73.55 25.5 59.8 53z" fill="#2684FC"/>
      <path d="M73.55 25.5H43.65L29.9 53h29.9z" fill="#FFBA00"/>
    </svg>
  );
}

export function GooglePhotosLogo({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M12 6.5A5.5 5.5 0 0 1 17.5 12c0 .6-.1 1.2-.3 1.7L21 16.5c1.2-1.3 2-3 2-5 0-4.1-3.4-7.5-7.5-7.5-.9 0-1.8.2-2.6.5l-.9 2z" fill="#EA4335"/>
      <path d="M6.5 12A5.5 5.5 0 0 1 12 6.5c.6 0 1.2.1 1.7.3L16.5 3C15.2 1.8 13.5 1 11.5 1 7.4 1 4 4.4 4 8.5c0 .9.2 1.8.5 2.6l2 .9z" fill="#FBBC05"/>
      <path d="M12 17.5A5.5 5.5 0 0 1 6.5 12c0-.6.1-1.2.3-1.7L3 7.5C1.8 8.8 1 10.5 1 12.5 1 16.6 4.4 20 8.5 20c.9 0 1.8-.2 2.6-.5l.9-2z" fill="#4285F4"/>
      <path d="M17.5 12A5.5 5.5 0 0 1 12 17.5c-.6 0-1.2-.1-1.7-.3L7.5 21c1.3 1.2 3 2 5 2 4.1 0 7.5-3.4 7.5-7.5 0-.9-.2-1.8-.5-2.6l-2-.9z" fill="#34A853"/>
    </svg>
  );
}

export interface CloudPhotoItem {
  id: string;
  url: string;
  title: string;
  source: 'photos' | 'drive';
  album?: string;
  folder?: string;
  date?: string;
  sizeMb?: number;
  dimensions?: string;
}

// Curated high-res photo gallery matching Google Photos and Google Drive integration
const GOOGLE_PHOTOS_MOCK_DATA: CloudPhotoItem[] = [
  {
    id: 'gp-1',
    url: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200&auto=format&fit=crop',
    title: 'Himalayan Ridge Sunrise',
    source: 'photos',
    album: 'Vacation & Travel',
    date: 'Oct 2025',
    dimensions: '4032 × 3024',
  },
  {
    id: 'gp-2',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&auto=format&fit=crop',
    title: 'Alpine Pass Afternoon',
    source: 'photos',
    album: 'Vacation & Travel',
    date: 'Oct 2025',
    dimensions: '3840 × 2160',
  },
  {
    id: 'gp-3',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop',
    title: 'Yosemite Valley Stream',
    source: 'photos',
    album: 'Vacation & Travel',
    date: 'Sep 2025',
    dimensions: '4000 × 2667',
  },
  {
    id: 'gp-4',
    url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=1200&auto=format&fit=crop',
    title: 'Emerald Mountain Palms',
    source: 'photos',
    album: 'Vacation & Travel',
    date: 'Aug 2025',
    dimensions: '3900 × 2600',
  },
  {
    id: 'gp-5',
    url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&auto=format&fit=crop',
    title: 'Parisian Bistro Autumn',
    source: 'photos',
    album: 'Favorites & Portraits',
    date: 'Jul 2025',
    dimensions: '4200 × 2800',
  },
  {
    id: 'gp-6',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop',
    title: 'Tropical Turquoise Shore',
    source: 'photos',
    album: 'Vacation & Travel',
    date: 'Jun 2025',
    dimensions: '4032 × 3024',
  },
  {
    id: 'gp-7',
    url: 'https://images.unsplash.com/photo-1588416936097-41850ab3d86d?w=1200&auto=format&fit=crop',
    title: 'Sigiriya Rock Fortress',
    source: 'photos',
    album: 'Vacation & Travel',
    date: 'May 2025',
    dimensions: '4240 × 2832',
  },
  {
    id: 'gp-8',
    url: 'https://images.unsplash.com/photo-1529636798458-92182e662485?w=1200&auto=format&fit=crop',
    title: 'Golden Hour Portrait',
    source: 'photos',
    album: 'Family & Celebrations',
    date: 'Apr 2025',
    dimensions: '3800 × 2533',
  },
  {
    id: 'gp-9',
    url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&auto=format&fit=crop',
    title: 'Kyoto Bamboo Pathway',
    source: 'photos',
    album: 'Vacation & Travel',
    date: 'Mar 2025',
    dimensions: '4000 × 2667',
  },
  {
    id: 'gp-10',
    url: 'https://images.unsplash.com/photo-1512100356356-de1b84283e18?w=1200&auto=format&fit=crop',
    title: 'White Sands Coastline',
    source: 'photos',
    album: 'Recent Camera Roll',
    date: 'Feb 2025',
    dimensions: '3600 × 2400',
  },
  {
    id: 'gp-11',
    url: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&auto=format&fit=crop',
    title: 'Glacial Alpine Lake Cruise',
    source: 'photos',
    album: 'Favorites & Portraits',
    date: 'Jan 2025',
    dimensions: '4032 × 3024',
  },
  {
    id: 'gp-12',
    url: 'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=1200&auto=format&fit=crop',
    title: 'Tuscan Hillside Villa',
    source: 'photos',
    album: 'Family & Celebrations',
    date: 'Dec 2024',
    dimensions: '3900 × 2600',
  },
  {
    id: 'gp-13',
    url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&auto=format&fit=crop',
    title: 'Desert Canyon Highway',
    source: 'photos',
    album: 'Recent Camera Roll',
    date: 'Nov 2024',
    dimensions: '4100 × 2733',
  },
  {
    id: 'gp-14',
    url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&auto=format&fit=crop',
    title: 'European Market Square',
    source: 'photos',
    album: 'Family & Celebrations',
    date: 'Oct 2024',
    dimensions: '4000 × 2667',
  },
];

const GOOGLE_DRIVE_MOCK_DATA: CloudPhotoItem[] = [
  {
    id: 'gd-1',
    url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&auto=format&fit=crop',
    title: 'DSC_4891_RAW_PrintMaster.jpg',
    source: 'drive',
    folder: 'Camera Uploads 2026',
    date: 'Today, 10:42 AM',
    sizeMb: 5.4,
    dimensions: '4500 × 3000',
  },
  {
    id: 'gd-2',
    url: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=1200&auto=format&fit=crop',
    title: 'IMG_7102_Wedding_Portraits.jpg',
    source: 'drive',
    folder: 'Family Archive',
    date: 'Yesterday, 3:15 PM',
    sizeMb: 6.8,
    dimensions: '4800 × 3200',
  },
  {
    id: 'gd-3',
    url: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1200&auto=format&fit=crop',
    title: 'Cinque_Terre_Harbor_HighRes.png',
    source: 'drive',
    folder: 'DSLR Raw Exports',
    date: 'Sep 24, 2026',
    sizeMb: 8.2,
    dimensions: '5120 × 2880',
  },
  {
    id: 'gd-4',
    url: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=1200&auto=format&fit=crop',
    title: 'Venice_Grand_Canal_Gondola.jpg',
    source: 'drive',
    folder: 'Camera Uploads 2026',
    date: 'Sep 18, 2026',
    sizeMb: 4.9,
    dimensions: '4032 × 3024',
  },
  {
    id: 'gd-5',
    url: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1200&auto=format&fit=crop',
    title: 'Louvre_Pyramid_Night_HDR.jpg',
    source: 'drive',
    folder: 'DSLR Raw Exports',
    date: 'Sep 12, 2026',
    sizeMb: 7.1,
    dimensions: '4600 × 3067',
  },
  {
    id: 'gd-6',
    url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&auto=format&fit=crop',
    title: 'Foggy_Redwood_Forest_Landscape.jpg',
    source: 'drive',
    folder: 'Camera Uploads 2026',
    date: 'Aug 29, 2026',
    sizeMb: 5.6,
    dimensions: '4200 × 2800',
  },
  {
    id: 'gd-7',
    url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&auto=format&fit=crop',
    title: 'Swiss_Alps_Pasture_Pan.png',
    source: 'drive',
    folder: 'Family Archive',
    date: 'Aug 14, 2026',
    sizeMb: 9.4,
    dimensions: '5400 × 2700',
  },
  {
    id: 'gd-8',
    url: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=1200&auto=format&fit=crop',
    title: 'Autumn_Foliage_Park_Trail.jpg',
    source: 'drive',
    folder: 'My Drive',
    date: 'Jul 30, 2026',
    sizeMb: 4.1,
    dimensions: '3840 × 2160',
  },
];

interface GooglePhotoPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'photos' | 'drive';
  onImportSuccess?: (count: number) => void;
}

export default function GooglePhotoPickerModal({
  isOpen,
  onClose,
  initialTab = 'photos',
  onImportSuccess,
}: GooglePhotoPickerModalProps) {
  const { addPhoto } = useEditorStore();
  const [activeTab, setActiveTab] = useState<'photos' | 'drive'>(initialTab);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeAlbum, setActiveAlbum] = useState<string>('All Photos & Timeline');
  const [activeFolder, setActiveFolder] = useState<string>('All Files');
  const [searchQuery, setSearchQuery] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // Sync initial tab when reopened
  useMemo(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  const photoAlbums = ['All Photos & Timeline', 'Vacation & Travel', 'Family & Celebrations', 'Favorites & Portraits', 'Recent Camera Roll'];
  const driveFolders = ['All Files', 'Camera Uploads 2026', 'DSLR Raw Exports', 'Family Archive', 'My Drive'];

  // Filter items based on active tab and query
  const items = useMemo(() => {
    if (activeTab === 'photos') {
      return GOOGLE_PHOTOS_MOCK_DATA.filter((p) => {
        const matchesAlbum = activeAlbum === 'All Photos & Timeline' || p.album === activeAlbum;
        const matchesSearch = !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesAlbum && matchesSearch;
      });
    } else {
      return GOOGLE_DRIVE_MOCK_DATA.filter((d) => {
        const matchesFolder = activeFolder === 'All Files' || d.folder === activeFolder;
        const matchesSearch = !searchQuery || d.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFolder && matchesSearch;
      });
    }
  }, [activeTab, activeAlbum, activeFolder, searchQuery]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    const allIds = new Set(items.map((i) => i.id));
    setSelectedIds(allIds);
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleImport = async () => {
    if (selectedIds.size === 0) return;
    setIsImporting(true);

    const allPool = [...GOOGLE_PHOTOS_MOCK_DATA, ...GOOGLE_DRIVE_MOCK_DATA];
    const selectedItems = allPool.filter((item) => selectedIds.has(item.id));

    let importedCount = 0;
    selectedItems.forEach((item, index) => {
      addPhoto({
        id: `cloud-${item.source}-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
        url: item.url,
        usedCount: 0,
        flagged: false,
        name: item.title,
      });
      importedCount++;
    });

    setIsImporting(false);
    setSelectedIds(new Set());
    if (onImportSuccess) {
      onImportSuccess(importedCount);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 md:p-6 animate-fade-in font-sans">
      <div className="bg-white rounded-md w-full max-w-5xl h-[88vh] max-h-[780px] flex flex-col shadow-2xl border border-cream-300 overflow-hidden">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200 bg-cream-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white border border-cream-300 flex items-center justify-center shadow-xs">
              {activeTab === 'photos' ? (
                <GooglePhotosLogo className="w-5 h-5" />
              ) : (
                <GoogleDriveLogo className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-serif font-bold text-noir-950">
                  {activeTab === 'photos' ? 'Google Photos' : 'Google Drive'} Importer
                </h2>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 size={10} /> Connected
                </span>
              </div>
              <p className="text-xs text-noir-500">
                Select high-resolution photos directly from your Google Cloud storage to import into your photobook.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 text-noir-400 hover:text-noir-900 rounded-full hover:bg-cream-100 transition-colors"
              aria-label="Close photo picker"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Source Navigation Tabs & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-3 border-b border-cream-200 bg-white shrink-0">
          {/* Main Provider Tabs */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab('photos');
                setSelectedIds(new Set());
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-sm text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'photos'
                  ? 'bg-noir-950 text-cream-50 shadow-xs'
                  : 'bg-cream-100 text-noir-700 hover:bg-cream-200'
              }`}
            >
              <GooglePhotosLogo className="w-3.5 h-3.5" />
              <span>Google Photos</span>
              <span className="text-[10px] opacity-75 font-mono">({GOOGLE_PHOTOS_MOCK_DATA.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('drive');
                setSelectedIds(new Set());
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-sm text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'drive'
                  ? 'bg-noir-950 text-cream-50 shadow-xs'
                  : 'bg-cream-100 text-noir-700 hover:bg-cream-200'
              }`}
            >
              <GoogleDriveLogo className="w-3.5 h-3.5" />
              <span>Google Drive</span>
              <span className="text-[10px] opacity-75 font-mono">({GOOGLE_DRIVE_MOCK_DATA.length})</span>
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeTab === 'photos' ? 'photos & albums' : 'drive files'}...`}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-cream-50 border border-cream-300 rounded-sm text-noir-900 focus:outline-none focus:border-noir-950"
            />
            <Search className="w-3.5 h-3.5 text-noir-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        {/* Filter Sub-nav (Albums or Folders) */}
        <div className="px-6 py-2 bg-cream-50/70 border-b border-cream-200 flex items-center justify-between text-xs overflow-x-auto shrink-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-noir-500 font-medium text-[11px] mr-1">
              {activeTab === 'photos' ? 'Albums:' : 'Folders:'}
            </span>
            {activeTab === 'photos'
              ? photoAlbums.map((album) => (
                  <button
                    key={album}
                    onClick={() => setActiveAlbum(album)}
                    className={`px-2.5 py-1 rounded-[2px] text-[11px] font-medium whitespace-nowrap transition-colors ${
                      activeAlbum === album
                        ? 'bg-foil-gold text-noir-950 font-bold'
                        : 'bg-white border border-cream-300 text-noir-700 hover:bg-cream-100'
                    }`}
                  >
                    {album}
                  </button>
                ))
              : driveFolders.map((folder) => (
                  <button
                    key={folder}
                    onClick={() => setActiveFolder(folder)}
                    className={`px-2.5 py-1 rounded-[2px] text-[11px] font-medium whitespace-nowrap transition-colors ${
                      activeFolder === folder
                        ? 'bg-foil-gold text-noir-950 font-bold'
                        : 'bg-white border border-cream-300 text-noir-700 hover:bg-cream-100'
                    }`}
                  >
                    {folder}
                  </button>
                ))}
          </div>

          {/* Selection Utilities */}
          <div className="flex items-center gap-2 shrink-0 ml-4">
            <button
              onClick={selectAll}
              className="text-[11px] text-noir-700 hover:text-noir-950 font-semibold underline decoration-cream-300"
            >
              Select All
            </button>
            <span className="text-cream-300">|</span>
            <button
              onClick={deselectAll}
              disabled={selectedIds.size === 0}
              className="text-[11px] text-noir-400 hover:text-noir-700 disabled:opacity-40"
            >
              Clear ({selectedIds.size})
            </button>
          </div>
        </div>

        {/* Media Items Grid */}
        <div className="flex-1 overflow-y-auto p-6 bg-cream-50/30">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-noir-500">
              <ImageIcon className="w-12 h-12 text-cream-400 mb-2" />
              <p className="font-serif text-lg text-noir-800">No matching items found</p>
              <p className="text-xs text-noir-500 max-w-sm mt-1">
                Try selecting a different album or clearing your search filter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              {items.map((item) => {
                const isSelected = selectedIds.has(item.id);

                return (
                  <div
                    key={item.id}
                    onClick={() => toggleSelect(item.id)}
                    className={`group relative aspect-square bg-cream-100 rounded-sm overflow-hidden cursor-pointer border-2 transition-all ${
                      isSelected
                        ? 'border-foil-gold ring-2 ring-foil-gold/40 shadow-md'
                        : 'border-cream-300 hover:border-noir-950'
                    }`}
                  >
                    <img
                      src={item.url}
                      alt={item.title}
                      className={`w-full h-full object-cover transition-transform duration-300 ${
                        isSelected ? 'scale-105' : 'group-hover:scale-105'
                      }`}
                    />

                    {/* Gradient Overlay for metadata reading */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/30 pointer-events-none" />

                    {/* Checkbox indicator */}
                    <div className="absolute top-2 right-2 z-10">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-foil-gold text-noir-950 shadow-sm scale-110'
                            : 'bg-black/50 text-white/70 group-hover:bg-black/80'
                        }`}
                      >
                        {isSelected ? <Check size={14} className="stroke-[3]" /> : <Square size={12} />}
                      </div>
                    </div>

                    {/* Provider Tag */}
                    <div className="absolute top-2 left-2 z-10">
                      <span className="bg-black/60 backdrop-blur-xs text-[9px] text-cream-100 px-1.5 py-0.5 rounded-[2px] font-mono flex items-center gap-1">
                        {item.source === 'photos' ? (
                          <>
                            <GooglePhotosLogo className="w-2.5 h-2.5" />
                            <span>{item.album?.split(' ')[0]}</span>
                          </>
                        ) : (
                          <>
                            <GoogleDriveLogo className="w-2.5 h-2.5" />
                            <span>{item.sizeMb}MB</span>
                          </>
                        )}
                      </span>
                    </div>

                    {/* Bottom Metadata */}
                    <div className="absolute bottom-2 left-2 right-2 text-white pointer-events-none">
                      <p className="text-[11px] font-medium truncate drop-shadow-xs">{item.title}</p>
                      <div className="flex items-center justify-between text-[9px] text-white/75 mt-0.5 font-mono">
                        <span>{item.date}</span>
                        {item.dimensions && <span>{item.dimensions}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer with Selection Stats & Import CTA */}
        <div className="px-6 py-4 border-t border-cream-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-noir-600">
            <span className="font-semibold text-noir-950 font-serif text-sm">
              {selectedIds.size}
            </span>
            <span>photo{selectedIds.size === 1 ? '' : 's'} selected</span>
            {selectedIds.size > 0 && (
              <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-medium">
                Ready for Archival Print
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-noir-600 hover:text-noir-950 transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={selectedIds.size === 0 || isImporting}
              onClick={handleImport}
              className="flex-1 sm:flex-initial px-6 py-2.5 bg-noir-950 hover:bg-noir-900 text-cream-50 rounded-sm text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xs"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-foil-gold" />
                  <span>Importing Photos...</span>
                </>
              ) : (
                <>
                  <span>
                    Import {selectedIds.size > 0 ? `(${selectedIds.size})` : ''} Photos to Photobook
                  </span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
