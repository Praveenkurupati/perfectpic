'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
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
  HardDrive,
  RefreshCw,
  AlertCircle,
  LogIn
} from 'lucide-react';
import { useEditorStore } from '@/stores/useEditorStore';
import { useAuthStore } from '@/stores/useAuthStore';

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
  isReal?: boolean;
}

// Fallback sample photography for offline exploration
const SAMPLE_PHOTOS_DATA: CloudPhotoItem[] = [
  {
    id: 'sp-1',
    url: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200&auto=format&fit=crop',
    title: 'Himalayan Ridge Sunrise',
    source: 'photos',
    album: 'Vacation & Travel',
    date: 'Oct 2025',
    dimensions: '4032 × 3024',
    isReal: false,
  },
  {
    id: 'sp-2',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&auto=format&fit=crop',
    title: 'Alpine Pass Afternoon',
    source: 'photos',
    album: 'Vacation & Travel',
    date: 'Oct 2025',
    dimensions: '3840 × 2160',
    isReal: false,
  },
  {
    id: 'sp-3',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop',
    title: 'Yosemite Valley Stream',
    source: 'photos',
    album: 'Vacation & Travel',
    date: 'Sep 2025',
    dimensions: '4000 × 2667',
    isReal: false,
  },
  {
    id: 'sp-4',
    url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=1200&auto=format&fit=crop',
    title: 'Emerald Mountain Palms',
    source: 'photos',
    album: 'Vacation & Travel',
    date: 'Aug 2025',
    dimensions: '3900 × 2600',
    isReal: false,
  },
  {
    id: 'sp-5',
    url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&auto=format&fit=crop',
    title: 'Parisian Bistro Autumn',
    source: 'photos',
    album: 'Favorites & Portraits',
    date: 'Jul 2025',
    dimensions: '4200 × 2800',
    isReal: false,
  },
  {
    id: 'sp-6',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop',
    title: 'Tropical Turquoise Shore',
    source: 'photos',
    album: 'Vacation & Travel',
    date: 'Jun 2025',
    dimensions: '4032 × 3024',
    isReal: false,
  },
  {
    id: 'sp-7',
    url: 'https://images.unsplash.com/photo-1588416936097-41850ab3d86d?w=1200&auto=format&fit=crop',
    title: 'Sigiriya Rock Fortress',
    source: 'photos',
    album: 'Vacation & Travel',
    date: 'May 2025',
    dimensions: '4240 × 2832',
    isReal: false,
  },
  {
    id: 'sp-8',
    url: 'https://images.unsplash.com/photo-1529636798458-92182e662485?w=1200&auto=format&fit=crop',
    title: 'Golden Hour Portrait',
    source: 'photos',
    album: 'Family & Celebrations',
    date: 'Apr 2025',
    dimensions: '3800 × 2533',
    isReal: false,
  },
  {
    id: 'sp-9',
    url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&auto=format&fit=crop',
    title: 'Kyoto Bamboo Pathway',
    source: 'photos',
    album: 'Vacation & Travel',
    date: 'Mar 2025',
    dimensions: '4000 × 2667',
    isReal: false,
  },
  {
    id: 'sp-10',
    url: 'https://images.unsplash.com/photo-1512100356356-de1b84283e18?w=1200&auto=format&fit=crop',
    title: 'White Sands Coastline',
    source: 'photos',
    album: 'Recent Camera Roll',
    date: 'Feb 2025',
    dimensions: '3600 × 2400',
    isReal: false,
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
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'photos' | 'drive'>(initialTab);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // Live Google Cloud Auth & Data State
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [isLoadingRealFiles, setIsLoadingRealFiles] = useState(false);
  const [realDrivePhotos, setRealDrivePhotos] = useState<CloudPhotoItem[]>([]);
  const [realGooglePhotos, setRealGooglePhotos] = useState<CloudPhotoItem[]>([]);
  const [authError, setAuthError] = useState<string | null>(null);
  const [apiWarning, setApiWarning] = useState<string | null>(null);
  const [activeViewMode, setActiveViewMode] = useState<'real' | 'sample'>('real');

  // Sync initial tab when opened
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      // Check if session has access token
      if (typeof window !== 'undefined') {
        const storedToken = sessionStorage.getItem('google_cloud_access_token');
        if (storedToken) {
          setAccessToken(storedToken);
        }
      }
    }
  }, [isOpen, initialTab]);

  // Request Access Token from Google Identity Services
  const handleConnectGoogle = useCallback(() => {
    setAuthError(null);
    setApiWarning(null);

    if (typeof window === 'undefined') return;

    const clientId =
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
      '422350650190-m70n8patc0s9rv9ltqt787n14952kov8.apps.googleusercontent.com';

    const googleAccounts = (window as any).google?.accounts;
    if (!googleAccounts?.oauth2) {
      setAuthError(
        'Google Identity Services SDK is loading. Please check your internet connection or try again in a few seconds.'
      );
      return;
    }

    setIsAuthorizing(true);

    try {
      // Scopes for Google Drive & Google Photos (using only valid Google scopes)
      const scopes = [
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/photoslibrary.readonly',
      ].join(' ');

      const tokenClient = googleAccounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: scopes,
        hint: user?.email,
        callback: async (tokenResponse: any) => {
          setIsAuthorizing(false);

          if (tokenResponse.error) {
            setAuthError(`Google authorization failed: ${tokenResponse.error_description || tokenResponse.error}`);
            return;
          }

          if (tokenResponse.access_token) {
            setAccessToken(tokenResponse.access_token);
            sessionStorage.setItem('google_cloud_access_token', tokenResponse.access_token);
            fetchGoogleCloudFiles(tokenResponse.access_token, activeTab);
          }
        },
      });

      tokenClient.requestAccessToken({ prompt: '' });
    } catch (err: any) {
      setIsAuthorizing(false);
      setAuthError(err.message || 'Failed to initialize Google authorization.');
    }
  }, [user?.email, activeTab]);

  // Fetch real Google Drive / Photos files using token
  const fetchGoogleCloudFiles = async (token: string, tab: 'photos' | 'drive') => {
    setIsLoadingRealFiles(true);
    setAuthError(null);
    setApiWarning(null);

    try {
      if (tab === 'drive') {
        // Fetch files from Google Drive API
        const q = encodeURIComponent("mimeType contains 'image/' and trashed = false");
        const fields = encodeURIComponent('files(id,name,mimeType,thumbnailLink,webContentLink,size,createdTime,imageMediaMetadata)');
        const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}&pageSize=100`;

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData.error?.message || res.statusText;
          if (errMsg.includes('has not been used') || errMsg.includes('disabled') || res.status === 403) {
            setApiWarning(
              'Google Drive API is not yet enabled in your Google Cloud Project. Enable it in Google Cloud Console > APIs & Services > Library > search "Google Drive API" > Enable.'
            );
          } else {
            setAuthError(`Google Drive API error: ${errMsg}`);
          }
          return;
        }

        const data = await res.json();
        const files = data.files || [];

        const items: CloudPhotoItem[] = files.map((f: any) => {
          // Replace =s220 with =s1600 for crystal clear high-res photo rendering
          const highResThumbnail = f.thumbnailLink ? f.thumbnailLink.replace(/=s\d+/, '=s1600') : f.webContentLink;
          const dimensions = f.imageMediaMetadata
            ? `${f.imageMediaMetadata.width} × ${f.imageMediaMetadata.height}`
            : undefined;
          const sizeMb = f.size ? +(f.size / (1024 * 1024)).toFixed(1) : undefined;
          const date = f.createdTime ? new Date(f.createdTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : undefined;

          return {
            id: f.id,
            url: highResThumbnail,
            title: f.name || 'Drive Photo',
            source: 'drive' as const,
            folder: 'Google Drive',
            date,
            sizeMb,
            dimensions,
            isReal: true,
          };
        });

        setRealDrivePhotos(items);
        setActiveViewMode('real');
      } else {
        // Fetch from Google Photos Library API
        const res = await fetch('https://photoslibrary.googleapis.com/v1/mediaItems?pageSize=100', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData.error?.message || res.statusText;

          if (errMsg.includes('has not been used') || errMsg.includes('disabled') || res.status === 403) {
            setApiWarning(
              'Google Photos API is not enabled in your Google Cloud Console. Enable it in Google Cloud Console > APIs & Services > Library > search "Photos Library API" > Enable.'
            );
          } else {
            setAuthError(`Google Photos API note: ${errMsg}`);
          }
          return;
        }

        const data = await res.json();
        const mediaItems = data.mediaItems || [];

        const items: CloudPhotoItem[] = mediaItems.map((p: any) => {
          const highResUrl = p.baseUrl ? `${p.baseUrl}=w1600-h1600` : '';
          const meta = p.mediaMetadata;
          const dimensions = meta ? `${meta.width} × ${meta.height}` : undefined;
          const date = meta?.creationTime
            ? new Date(meta.creationTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : undefined;

          return {
            id: p.id,
            url: highResUrl,
            title: p.filename || 'Google Photo',
            source: 'photos' as const,
            album: 'Google Photos',
            date,
            dimensions,
            isReal: true,
          };
        });

        setRealGooglePhotos(items);
        setActiveViewMode('real');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Failed to fetch files from Google.');
    } finally {
      setIsLoadingRealFiles(false);
    }
  };

  // Launch official Native Google Picker UI dialog
  const handleOpenNativeGooglePicker = () => {
    if (!accessToken) {
      handleConnectGoogle();
      return;
    }

    if (typeof window === 'undefined') return;
    const gapi = (window as any).gapi;
    const google = (window as any).google;

    if (!gapi || !google?.picker) {
      setAuthError('Google Picker library is loading. Please try again in a moment.');
      return;
    }

    gapi.load('picker', () => {
      try {
        const view = new google.picker.DocsView(
          activeTab === 'photos' ? google.picker.ViewId.PHOTOS : google.picker.ViewId.DOCS_IMAGES
        );
        view.setIncludeFolders(true);

        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
        const builder = new google.picker.PickerBuilder()
          .addView(view)
          .setOAuthToken(accessToken)
          .setCallback((pickerData: any) => {
            if (pickerData.action === google.picker.Action.PICKED) {
              const docs = pickerData.docs || [];
              docs.forEach((doc: any, idx: number) => {
                const photoUrl = doc.thumbnails?.[0]?.url || doc.url;
                addPhoto({
                  id: `gcloud-${doc.id}-${idx}`,
                  url: photoUrl,
                  usedCount: 0,
                  flagged: false,
                  name: doc.name || 'Google Cloud Photo',
                });
              });
              if (onImportSuccess) {
                onImportSuccess(docs.length);
              }
              onClose();
            }
          });

        if (apiKey && !apiKey.includes('your_google_api_key')) {
          builder.setDeveloperKey(apiKey);
        }

        const picker = builder.build();
        picker.setVisible(true);
      } catch (err: any) {
        setAuthError(`Could not open Google Picker: ${err.message}`);
      }
    });
  };

  // Auto-fetch if token is already active when switching tabs
  useEffect(() => {
    if (accessToken) {
      fetchGoogleCloudFiles(accessToken, activeTab);
    }
  }, [activeTab, accessToken]);

  // Determine current active item pool
  const activePool = useMemo(() => {
    if (activeViewMode === 'sample') {
      return SAMPLE_PHOTOS_DATA;
    }
    return activeTab === 'drive' ? realDrivePhotos : realGooglePhotos;
  }, [activeViewMode, activeTab, realDrivePhotos, realGooglePhotos]);

  const items = useMemo(() => {
    return activePool.filter((item) => {
      const matchesSearch = !searchQuery || item.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [activePool, searchQuery]);

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

    const selectedItems = activePool.filter((item) => selectedIds.has(item.id));
    let importedCount = 0;

    selectedItems.forEach((item, index) => {
      addPhoto({
        id: `gcloud-${item.source}-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 md:p-6 animate-fade-in font-sans">
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
                {accessToken ? (
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 font-mono">
                    <CheckCircle2 size={10} /> Connected {user?.email ? `(${user.email})` : ''}
                  </span>
                ) : (
                  <span className="text-[10px] bg-amber-50 text-amber-800 font-semibold px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                    Connect Account
                  </span>
                )}
              </div>
              <p className="text-xs text-noir-500">
                Directly import personal high-resolution photographs from your Google Cloud storage.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Native Google Picker Button */}
            {accessToken && (
              <button
                type="button"
                onClick={handleOpenNativeGooglePicker}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 border border-cream-300 bg-white hover:bg-cream-100 text-noir-900 rounded-sm text-xs font-medium transition-colors shadow-xs"
              >
                <ExternalLink size={12} className="text-foil-gold" />
                <span>Open Native Google Picker</span>
              </button>
            )}

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
              {realGooglePhotos.length > 0 && (
                <span className="text-[10px] opacity-75 font-mono">({realGooglePhotos.length})</span>
              )}
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
              {realDrivePhotos.length > 0 && (
                <span className="text-[10px] opacity-75 font-mono">({realDrivePhotos.length})</span>
              )}
            </button>
          </div>

          {/* Quick Actions & Search */}
          <div className="flex items-center gap-2">
            {accessToken && (
              <button
                type="button"
                onClick={() => fetchGoogleCloudFiles(accessToken, activeTab)}
                disabled={isLoadingRealFiles}
                className="p-1.5 border border-cream-300 rounded-sm text-noir-600 hover:text-noir-950 hover:bg-cream-100 transition-colors"
                title="Refresh cloud files"
              >
                <RefreshCw size={14} className={isLoadingRealFiles ? 'animate-spin text-foil-gold' : ''} />
              </button>
            )}

            <div className="relative w-full sm:w-60">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${activeTab === 'photos' ? 'photos' : 'drive files'}...`}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-cream-50 border border-cream-300 rounded-sm text-noir-900 focus:outline-none focus:border-noir-950"
              />
              <Search className="w-3.5 h-3.5 text-noir-400 absolute left-2.5 top-2.5" />
            </div>
          </div>
        </div>

        {/* Warning / Notice Banner if API needs to be enabled */}
        {apiWarning && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 text-xs text-amber-900 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <AlertCircle size={15} className="text-amber-700 shrink-0 mt-0.5" />
              <div className="leading-tight">
                <span className="font-semibold">Notice: </span>
                {apiWarning}
              </div>
            </div>
            <button
              onClick={() => setActiveViewMode('sample')}
              className="text-[11px] font-bold text-amber-950 underline shrink-0"
            >
              Browse Sample Photos
            </button>
          </div>
        )}

        {/* Auth Error Banner */}
        {authError && (
          <div className="bg-red-50 border-b border-red-200 px-6 py-2.5 text-xs text-red-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle size={15} className="text-red-600 shrink-0" />
              <span>{authError}</span>
            </div>
            <button
              onClick={() => setAuthError(null)}
              className="text-xs font-bold text-red-900 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-cream-50/30">
          {/* State 1: Not Connected Yet -> Show Beautiful Connect Screen */}
          {!accessToken && activeViewMode === 'real' ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 max-w-lg mx-auto space-y-5">
              <div className="w-16 h-16 rounded-full bg-white border border-cream-300 shadow-md flex items-center justify-center">
                {activeTab === 'photos' ? (
                  <GooglePhotosLogo className="w-8 h-8" />
                ) : (
                  <GoogleDriveLogo className="w-8 h-8" />
                )}
              </div>

              <div className="space-y-1.5">
                <h3 className="font-serif text-2xl font-bold text-noir-950">
                  Connect {activeTab === 'photos' ? 'Google Photos' : 'Google Drive'}
                </h3>
                <p className="text-xs text-noir-600 leading-relaxed">
                  Authorize PerfectPic to access your personal {activeTab === 'photos' ? 'photos & albums' : 'Drive images'} for print. We only request read access to select the photos you choose.
                </p>
                {user?.email && (
                  <p className="text-[11px] text-foil-gold font-medium font-mono pt-1">
                    Will connect to: {user.email}
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 w-full justify-center">
                <button
                  type="button"
                  onClick={handleConnectGoogle}
                  disabled={isAuthorizing}
                  className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-cream-100 text-noir-900 border border-cream-300 hover:border-noir-950 rounded-sm text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-sm transition-all group disabled:opacity-50"
                >
                  {isAuthorizing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-foil-gold" />
                      <span>Authorizing with Google...</span>
                    </>
                  ) : (
                    <>
                      <GoogleLogo className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      <span>Connect Google Account</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveViewMode('sample')}
                  className="text-xs text-noir-500 hover:text-noir-900 font-medium underline py-2"
                >
                  Or explore sample gallery
                </button>
              </div>

              <div className="p-3 bg-cream-100 border border-cream-200 rounded-sm text-[11px] text-noir-600 text-left space-y-1 mt-4">
                <div className="flex items-center gap-1.5 font-semibold text-noir-900">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  <span>Privacy Protected</span>
                </div>
                <p className="text-[10px] text-noir-500">
                  Only the images you explicitly select are imported into your photobook layout. No external files are downloaded without your consent.
                </p>
              </div>
            </div>
          ) : isLoadingRealFiles ? (
            /* State 2: Loading Real Files from Google */
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-foil-gold" />
              <p className="font-serif text-lg text-noir-950">
                Fetching your {activeTab === 'photos' ? 'Google Photos' : 'Google Drive files'}...
              </p>
              <p className="text-xs text-noir-500 max-w-sm">
                Retrieving your high-resolution images from Google Cloud.
              </p>
            </div>
          ) : items.length === 0 ? (
            /* State 3: Empty State (No photos in drive/photos) */
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-noir-500 space-y-3">
              <ImageIcon className="w-12 h-12 text-cream-400" />
              <p className="font-serif text-xl text-noir-800">
                No images found in your {activeTab === 'photos' ? 'Google Photos' : 'Google Drive'}
              </p>
              <p className="text-xs text-noir-500 max-w-sm">
                Make sure you have JPEG, PNG, or WebP images uploaded in your Google {activeTab === 'photos' ? 'Photos' : 'Drive'}.
              </p>
              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={handleOpenNativeGooglePicker}
                  className="px-4 py-2 bg-noir-950 text-cream-50 rounded-sm text-xs font-semibold"
                >
                  Open Native Google Picker
                </button>
                <button
                  onClick={() => setActiveViewMode('sample')}
                  className="text-xs text-noir-700 underline"
                >
                  View Sample Photos
                </button>
              </div>
            </div>
          ) : (
            /* State 4: Real Photos Grid */
            <div>
              {/* Header stats & select all */}
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-cream-200 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-noir-950">
                    {items.length} {activeTab === 'photos' ? 'photos' : 'files'} available
                  </span>
                  {activeViewMode === 'sample' && (
                    <span className="bg-amber-100 text-amber-900 text-[10px] px-2 py-0.5 rounded font-mono">
                      Sample Gallery
                    </span>
                  )}
                  {activeViewMode === 'sample' && accessToken && (
                    <button
                      onClick={() => setActiveViewMode('real')}
                      className="text-foil-gold hover:underline font-semibold text-[11px]"
                    >
                      ← Switch to My Real Google Files
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={selectAll}
                    className="text-[11px] text-noir-700 hover:text-noir-950 font-semibold underline"
                  >
                    Select All
                  </button>
                  <span className="text-cream-300">|</span>
                  <button
                    onClick={deselectAll}
                    disabled={selectedIds.size === 0}
                    className="text-[11px] text-noir-400 hover:text-noir-700 disabled:opacity-40"
                  >
                    Clear Selection ({selectedIds.size})
                  </button>
                </div>
              </div>

              {/* Grid */}
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
                        loading="lazy"
                      />

                      {/* Gradient overlay */}
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

                      {/* Provider Badge */}
                      <div className="absolute top-2 left-2 z-10">
                        <span className="bg-black/60 backdrop-blur-xs text-[9px] text-cream-100 px-1.5 py-0.5 rounded-[2px] font-mono flex items-center gap-1">
                          {item.source === 'photos' ? (
                            <>
                              <GooglePhotosLogo className="w-2.5 h-2.5" />
                              <span>Photos</span>
                            </>
                          ) : (
                            <>
                              <GoogleDriveLogo className="w-2.5 h-2.5" />
                              <span>{item.sizeMb ? `${item.sizeMb}MB` : 'Drive'}</span>
                            </>
                          )}
                        </span>
                      </div>

                      {/* Bottom info */}
                      <div className="absolute bottom-2 left-2 right-2 text-white pointer-events-none">
                        <p className="text-[11px] font-medium truncate drop-shadow-xs">{item.title}</p>
                        <div className="flex items-center justify-between text-[9px] text-white/75 mt-0.5 font-mono">
                          <span>{item.date || ''}</span>
                          {item.dimensions && <span>{item.dimensions}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="px-6 py-4 border-t border-cream-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-noir-600">
            <span className="font-semibold text-noir-950 font-serif text-sm">
              {selectedIds.size}
            </span>
            <span>photo{selectedIds.size === 1 ? '' : 's'} selected</span>
            {selectedIds.size > 0 && (
              <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-medium">
                Ready for Photobook
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
                  <span>Importing...</span>
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
