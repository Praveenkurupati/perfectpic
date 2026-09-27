'use client';

import { useEditorStore } from '@/stores/useEditorStore';

const defaultSamplePhotos = [
  'https://images.unsplash.com/photo-1580974582391-a6649c82a85f?w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1579564177579-22a49f50f2fb?w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1620216664966-218eb8a40d51?w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1533050487297-09b450131914?w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1586526462747-d5d1ea857f13?w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1625736173007-88fcf32d20d7?w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1582496739818-d4cbf2826cce?w=400&auto=format&fit=crop'
];

export default function PhotoTray() {
  const { photos, photoFilter, setPhotoFilter, addPhoto } = useEditorStore();

  const displayPhotos = photos.length > 0 
    ? photos.map(p => ({ id: p.id, url: p.url, used: p.usedCount > 0, flagged: p.flagged }))
    : defaultSamplePhotos.map((url, i) => ({ id: `default-${i}`, url, used: i % 3 === 0, flagged: false }));

  const filteredPhotos = displayPhotos.filter(p => {
    if (photoFilter === 'unused') return !p.used;
    if (photoFilter === 'flagged') return p.flagged;
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex border-b border-cream-300 text-xs uppercase tracking-wider font-semibold">
        {[
          { key: 'all', label: `All (${displayPhotos.length})` },
          { key: 'unused', label: 'Unused' },
          { key: 'flagged', label: 'Favorites' }
        ].map(filter => (
          <button 
            key={filter.key}
            onClick={() => setPhotoFilter(filter.key as any)}
            className={`flex-1 py-3 text-center border-b-2 transition-colors ${
              photoFilter === filter.key 
                ? 'border-noir-950 text-noir-950 font-bold' 
                : 'border-transparent text-noir-400 hover:text-noir-700'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-2.5 content-start">
        {filteredPhotos.map((photo) => (
          <div 
            key={photo.id} 
            className="aspect-square bg-cream-200 rounded-sm relative group overflow-hidden cursor-grab shadow-sm border border-cream-200 hover:border-foil-gold transition-all"
          >
            <img src={photo.url} alt="Tray Photo" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            {photo.used && (
              <span className="absolute top-1 right-1 bg-black/75 backdrop-blur-sm text-cream-50 text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-[2px] font-semibold">
                Placed
              </span>
            )}
          </div>
        ))}
      </div>
      
      <div className="p-3 border-t border-cream-300 bg-cream-50">
        <label className="w-full py-2.5 bg-white border border-dashed border-cream-400 rounded-sm text-xs font-semibold text-noir-900 hover:border-noir-950 transition-colors flex items-center justify-center cursor-pointer text-center">
          <span>+ Upload More Photos</span>
          <input 
            type="file" 
            multiple 
            accept="image/*" 
            className="hidden" 
            onChange={(e) => {
              if (e.target.files) {
                Array.from(e.target.files).forEach((file, idx) => {
                  const url = URL.createObjectURL(file);
                  addPhoto({
                    id: `upload-${Date.now()}-${idx}`,
                    url,
                    usedCount: 0,
                    flagged: false,
                    name: file.name
                  });
                });
              }
            }} 
          />
        </label>
      </div>
    </div>
  );
}
