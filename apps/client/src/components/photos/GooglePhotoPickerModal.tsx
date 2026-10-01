'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  X, 
  Check, 
  CheckCircle2, 
  Image as ImageIcon, 
  Folder, 
  Search, 
  Loader2, 
  Square, 
  ExternalLink,
  ArrowRight,
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
  date?: string;
  sizeMb?: number;
  dimensions?: string;
}

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

  // Live Google Cloud State
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [isLoadingRealFiles, setIsLoadingRealFiles] = useState(false);
  const [realDrivePhotos, setRealDrivePhotos] = useState<CloudPhotoItem[]>([]);
  const [realGooglePhotos, setRealGooglePhotos] = useState<CloudPhotoItem[]>([]);
  const [authError, setAuthError] = useState<string | null>(null);

  // Fetch real Google Drive / Photos files using token
  const fetchGoogleCloudFiles = useCallback(async (token: string, tab: 'photos' | 'drive') => {
    setIsLoadingRealFiles(true);
    setAuthError(null);

    try {
      if (tab === 'drive') {
        const q = encodeURIComponent("mimeType contains 'image/' and trashed = false");
        const fields = encodeURIComponent('files(id,name,mimeType,thumbnailLink,webContentLink,size,createdTime,imageMediaMetadata)');
        const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}&pageSize=100`;

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData.error?.message || res.statusText;
          setAuthError(`Google Drive: ${errMsg}`);
          return;
        }

        const data = await res.json();
        const files = data.files || [];

        const items: CloudPhotoItem[] = files.map((f: any) => {
          const highResThumbnail = f.thumbnailLink ? f.thumbnailLink.replace(/=s\d+/, '=s1600') : f.webContentLink;
          const dimensions = f.imageMediaMetadata
            ? `${f.imageMediaMetadata.width} × ${f.imageMediaMetadata.height}`
            : undefined;
          const sizeMb = f.size ? +(f.size / (1024 * 1024)).toFixed(1) : undefined;
          const date = f.createdTime
            ? new Date(f.createdTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : undefined;

          return {
            id: f.id,
            url: highResThumbnail,
            title: f.name || 'Drive Image',
            source: 'drive' as const,
            date,
            sizeMb,
            dimensions,
          };
        });

        setRealDrivePhotos(items);
      } else {
        const res = await fetch('https://photoslibrary.googleapis.com/v1/mediaItems?pageSize=100', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData.error?.message || res.statusText;
          setAuthError(`Google Photos: ${errMsg}`);
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
            date,
            dimensions,
          };
        });

        setRealGooglePhotos(items);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Failed to fetch files from Google.');
    } finally {
      setIsLoadingRealFiles(false);
    }
  }, []);

  // Request Access Token directly from Google Identity Services
  const handleConnectGoogle = useCallback(() => {
    setAuthError(null);
    if (typeof window === 'undefined') return;

    const clientId =
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
      '422350650190-m70n8patc0s9rv9ltqt787n14952kov8.apps.googleusercontent.com';

    const googleAccounts = (window as any).google?.accounts;
    if (!googleAccounts?.oauth2) {
      setAuthError('Google Identity Services SDK is initializing. Please wait a moment and try again.');
      return;
    }

    setIsAuthorizing(true);

    try {
      const scopes = activeTab === 'drive'
        ? 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file'
        : 'https://www.googleapis.com/auth/photoslibrary.readonly';

      const tokenClient = googleAccounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: scopes,
        hint: user?.email,
        callback: async (tokenResponse: any) => {
          setIsAuthorizing(false);

          if (tokenResponse.error) {
            setAuthError(tokenResponse.error_description || tokenResponse.error || 'Google authorization cancelled.');
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
  }, [user?.email, activeTab, fetchGoogleCloudFiles]);

  // Open Native Google Picker UI dialog
  const handleOpenNativeGooglePicker = useCallback(() => {
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
        const view = activeTab === 'photos'
          ? new google.picker.PhotosView()
          : new google.picker.DocsView(google.picker.ViewId.DOCS_IMAGES).setIncludeFolders(true);

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
  }, [accessToken, activeTab, handleConnectGoogle, addPhoto, onImportSuccess, onClose]);

  // On modal open: synchronize tab, restore session token, and auto-fetch or auto-prompt
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setSelectedIds(new Set());
      setAuthError(null);

      if (typeof window !== 'undefined') {
        const storedToken = sessionStorage.getItem('google_cloud_access_token');
        if (storedToken) {
          setAccessToken(storedToken);
          fetchGoogleCloudFiles(storedToken, initialTab);
        } else {
          // Immediately prompt Google sign-in for seamless experience
          const timer = setTimeout(() => {
            handleConnectGoogle();
          }, 400);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [isOpen, initialTab, fetchGoogleCloudFiles, handleConnectGoogle]);

  // When switching tabs with active token
  useEffect(() => {
    if (isOpen && accessToken) {
      fetchGoogleCloudFiles(accessToken, activeTab);
    }
  }, [isOpen, activeTab, accessToken, fetchGoogleCloudFiles]);

  const activePool = useMemo(() => {
    return activeTab === 'drive' ? realDrivePhotos : realGooglePhotos;
  }, [activeTab, realDrivePhotos, realGooglePhotos]);

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
                  {activeTab === 'photos' ? 'Google Photos' : 'Google Drive'}
                </h2>
                {accessToken ? (
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 font-mono">
                    <CheckCircle2 size={10} /> Connected {user?.email ? `(${user.email})` : ''}
                  </span>
                ) : (
                  <span className="text-[10px] bg-amber-50 text-amber-800 font-semibold px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                    Connecting to Google...
                  </span>
                )}
              </div>
              <p className="text-xs text-noir-500">
                Choose photos from your personal Google storage to import directly into your photobook.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Open Google Native Picker Dialog */}
            <button
              type="button"
              onClick={handleOpenNativeGooglePicker}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-cream-300 bg-white hover:bg-cream-100 text-noir-900 rounded-sm text-xs font-semibold transition-colors shadow-xs"
            >
              <ExternalLink size={12} className="text-foil-gold" />
              <span>Google Picker Window</span>
            </button>

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

          <div className="flex items-center gap-2">
            {accessToken && (
              <button
                type="button"
                onClick={() => fetchGoogleCloudFiles(accessToken, activeTab)}
                disabled={isLoadingRealFiles}
                className="p-1.5 border border-cream-300 rounded-sm text-noir-600 hover:text-noir-950 hover:bg-cream-100 transition-colors"
                title="Refresh Google files"
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

        {/* Error Notification Banner */}
        {authError && (
          <div className="bg-red-50 border-b border-red-200 px-6 py-3 text-xs text-red-800 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <AlertCircle size={15} className="text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Authorization note: </span>
                {authError}
              </div>
            </div>
            <button
              onClick={handleConnectGoogle}
              className="text-xs font-bold text-red-950 underline shrink-0 hover:text-red-700"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-cream-50/30">
          {!accessToken ? (
            /* Prompt to connect Google */
            <div className="h-full flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-full bg-white border border-cream-300 shadow-md flex items-center justify-center">
                {activeTab === 'photos' ? (
                  <GooglePhotosLogo className="w-8 h-8" />
                ) : (
                  <GoogleDriveLogo className="w-8 h-8" />
                )}
              </div>

              <div>
                <h3 className="font-serif text-2xl font-bold text-noir-950">
                  Connect {activeTab === 'photos' ? 'Google Photos' : 'Google Drive'}
                </h3>
                <p className="text-xs text-noir-600 mt-1 leading-relaxed">
                  Sign in to browse and import your high-resolution personal photographs directly from your Google account.
                </p>
                {user?.email && (
                  <p className="text-[11px] text-foil-gold font-mono font-medium mt-1">
                    Target account: {user.email}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handleConnectGoogle}
                disabled={isAuthorizing}
                className="px-6 py-3 bg-white hover:bg-cream-100 text-noir-900 border border-cream-300 hover:border-noir-950 rounded-sm text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-sm transition-all group disabled:opacity-50"
              >
                {isAuthorizing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-foil-gold" />
                    <span>Connecting with Google...</span>
                  </>
                ) : (
                  <>
                    <GoogleLogo className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>Authorize with Google</span>
                  </>
                )}
              </button>
            </div>
          ) : isLoadingRealFiles ? (
            /* Loading real files */
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-foil-gold" />
              <p className="font-serif text-lg text-noir-950">
                Loading your {activeTab === 'photos' ? 'Google Photos' : 'Google Drive files'}...
              </p>
              <p className="text-xs text-noir-500">
                Accessing high-resolution personal photographs from Google Cloud.
              </p>
            </div>
          ) : items.length === 0 ? (
            /* Empty state (no files found in user's drive/photos) */
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-noir-500 space-y-3">
              <ImageIcon className="w-12 h-12 text-cream-400" />
              <p className="font-serif text-xl text-noir-800">
                No images found in your {activeTab === 'photos' ? 'Google Photos' : 'Google Drive'}
              </p>
              <p className="text-xs text-noir-500 max-w-sm">
                Ensure you have JPEG, PNG, or WebP photographs saved in your {activeTab === 'photos' ? 'Google Photos' : 'Google Drive'}.
              </p>
              <button
                onClick={handleOpenNativeGooglePicker}
                className="mt-2 px-4 py-2 bg-noir-950 text-cream-50 rounded-sm text-xs font-semibold flex items-center gap-1.5"
              >
                <ExternalLink size={13} />
                <span>Open Google Picker Window</span>
              </button>
            </div>
          ) : (
            /* Real Google Files Grid */
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-cream-200 text-xs">
                <span className="font-semibold text-noir-950">
                  {items.length} {activeTab === 'photos' ? 'photos' : 'files'} found in your Google account
                </span>

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

                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/30 pointer-events-none" />

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
