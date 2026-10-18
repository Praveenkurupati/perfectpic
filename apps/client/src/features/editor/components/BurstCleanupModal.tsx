'use client';

import React from 'react';
import { 
  X, 
  Sparkles, 
  Check, 
  Flame, 
  Layers, 
  CheckCircle2, 
  Star, 
  Eye, 
  Trash2, 
  Filter 
} from 'lucide-react';
import { useEditorStore, Photo } from '@/stores/useEditorStore';
import { BurstCluster } from '@/lib/burstPhotoDetector';
import { normalizeImageUrl, handleImageError } from '@/lib/urls';

interface BurstCleanupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BurstCleanupModal({ isOpen, onClose }: BurstCleanupModalProps) {
  const {
    photos,
    burstGroups,
    keepOnlyBestPicks,
    togglePhotoExclusion,
    setPhotoAsBestPick,
    isDetectingBursts,
  } = useEditorStore();

  if (!isOpen) return null;

  const totalDuplicates = burstGroups.reduce((acc, c) => acc + (c.photos.length - 1), 0);
  const excludedCount = photos.filter((p) => p.isExcludedFromAutofill).length;

  const handleApplyBestPicks = () => {
    keepOnlyBestPicks();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-white border border-cream-300 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-scale-up">
        {/* Modal Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-cream-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600">
              <Sparkles className="w-5 h-5 text-foil-gold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg font-bold text-gray-950">
                  Burst & Duplicate Photo Filter
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  {burstGroups.length} Burst Sets ({totalDuplicates} duplicates)
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Our client-side analyzer clustered continuous burst shots and selected the crispiest, highest-sharpness photo in each group.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content / Burst Sets List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {isDetectingBursts ? (
            <div className="py-16 text-center text-gray-400 font-mono text-xs">
              <Sparkles className="w-6 h-6 mx-auto mb-2 text-foil-gold animate-spin" />
              Scanning photos for perceptual similarity and sharpness...
            </div>
          ) : burstGroups.length === 0 ? (
            <div className="py-16 text-center text-gray-500">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
              <h4 className="font-serif text-base font-bold text-gray-900">
                All Photos Are Unique!
              </h4>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                No duplicate or burst continuous shots detected. Every photo in your tray is ready for distinct placement.
              </p>
            </div>
          ) : (
            burstGroups.map((cluster, cIndex) => {
              return (
                <div
                  key={cluster.clusterId}
                  className="bg-gray-50/80 border border-gray-200 rounded-xl p-4 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-200/80">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-noir-950 text-cream-50 text-xs font-mono font-bold flex items-center justify-center">
                        {cIndex + 1}
                      </span>
                      <span className="font-serif font-bold text-sm text-gray-900">
                        {cluster.isExactDuplicate ? 'Identical Duplicates' : 'Burst Sequence'}
                      </span>
                      <span className="text-[11px] font-mono text-gray-500">
                        ({cluster.photos.length} shots · {cluster.similarityPercentage}% match)
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-500 font-mono">
                      {cluster.reason}
                    </span>
                  </div>

                  {/* Horizontal Scroll of Cluster Photos */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-1">
                    {cluster.photos.map((photo) => {
                      const isBest = cluster.bestPickPhotoId === photo.id;
                      const isExcluded = !!photo.isExcludedFromAutofill;

                      return (
                        <div
                          key={photo.id}
                          className={`relative rounded-xl overflow-hidden border transition-all ${
                            isBest
                              ? 'border-foil-gold ring-2 ring-foil-gold/30 shadow-md bg-amber-50/20'
                              : isExcluded
                              ? 'border-gray-200 opacity-50 bg-gray-100'
                              : 'border-gray-200 bg-white'
                          }`}
                        >
                          <div className="aspect-square relative overflow-hidden group">
                            <img
                              src={normalizeImageUrl(photo.url)}
                              alt={photo.name || 'Photo'}
                              onError={handleImageError}
                              className="w-full h-full object-cover"
                            />

                            {/* Best Pick Crown Badge */}
                            {isBest && (
                              <div className="absolute top-1.5 left-1.5 bg-noir-950/90 text-foil-gold px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 shadow-xs border border-foil-gold/50 backdrop-blur-xs">
                                <Star className="w-3 h-3 fill-foil-gold text-foil-gold" />
                                <span>Best Pick</span>
                              </div>
                            )}

                            {/* Sharpness Metric Badge */}
                            <div className="absolute bottom-1.5 left-1.5 bg-black/75 text-white px-1.5 py-0.5 rounded text-[8px] font-mono font-bold backdrop-blur-xs">
                              {photo.blurScore ? `VoL ${photo.blurScore}` : 'Sharp'}
                            </div>

                            {/* Exclude / Keep Toggle Overlay Checkbox */}
                            <button
                              type="button"
                              onClick={() => togglePhotoExclusion(photo.id)}
                              className={`absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                                !isExcluded
                                  ? 'bg-black text-white shadow-xs'
                                  : 'bg-white/80 text-gray-400 border border-gray-300'
                              }`}
                              title={isExcluded ? 'Click to include in photobook' : 'Click to exclude duplicate'}
                            >
                              {!isExcluded ? (
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              ) : (
                                <X className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>

                          {/* Footer action */}
                          <div className="p-2 text-center bg-white border-t border-gray-100">
                            {isBest ? (
                              <span className="text-[10px] font-bold text-foil-gold block">
                                Recommended
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setPhotoAsBestPick(cluster.clusterId, photo.id)}
                                className="text-[10px] text-gray-600 hover:text-black font-semibold hover:underline block w-full"
                              >
                                Set as Best
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs font-mono text-gray-600 text-center sm:text-left">
            <span>
              {excludedCount > 0 ? (
                <strong className="text-black">{excludedCount} redundant shots</strong>
              ) : (
                'All shots currently active'
              )}{' '}
              marked for exclusion from layout
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 hover:border-gray-900 text-gray-700 text-xs font-semibold rounded-lg transition-colors"
            >
              Done
            </button>
            <button
              type="button"
              onClick={handleApplyBestPicks}
              className="flex-1 sm:flex-none px-5 py-2 bg-black hover:bg-gray-800 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-foil-gold" />
              <span>Keep Only Best Picks ({burstGroups.length})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
