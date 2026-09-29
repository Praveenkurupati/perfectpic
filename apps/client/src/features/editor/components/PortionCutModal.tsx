'use client';

import React, { useState, useEffect } from 'react';
import {
  Crop,
  X,
  RotateCcw,
  Check,
  Grid3X3,
  ZoomIn,
  Move,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Photo, SlotCropConfig, PhotoCropPosition } from '@/stores/useEditorStore';

interface PortionCutModalProps {
  isOpen: boolean;
  onClose: () => void;
  slotId: string;
  photo: Photo;
  label?: string;
  currentCrop?: SlotCropConfig;
  onApplyCrop: (slotId: string, crop: SlotCropConfig) => void;
}

export default function PortionCutModal({
  isOpen,
  onClose,
  slotId,
  photo,
  label,
  currentCrop,
  onApplyCrop,
}: PortionCutModalProps) {
  const [focalX, setFocalX] = useState<number>(50);
  const [focalY, setFocalY] = useState<number>(50);
  const [zoom, setZoom] = useState<number>(1.0);
  const [activePreset, setActivePreset] = useState<PhotoCropPosition>('center');

  // Synchronize initial state when modal opens
  useEffect(() => {
    if (isOpen) {
      setFocalX(currentCrop?.x ?? 50);
      setFocalY(currentCrop?.y ?? 50);
      setZoom(currentCrop?.zoom ?? 1.0);
      setActivePreset(currentCrop?.position ?? 'center');
    }
  }, [isOpen, currentCrop]);

  if (!isOpen) return null;

  const handleSelectPreset = (pos: PhotoCropPosition, x: number, y: number) => {
    setActivePreset(pos);
    setFocalX(x);
    setFocalY(y);
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const clickY = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setFocalX(Math.max(0, Math.min(100, clickX)));
    setFocalY(Math.max(0, Math.min(100, clickY)));
    setActivePreset('custom');
  };

  const handleReset = () => {
    setFocalX(50);
    setFocalY(50);
    setZoom(1.0);
    setActivePreset('center');
  };

  const handleApply = () => {
    onApplyCrop(slotId, {
      position: activePreset,
      x: focalX,
      y: focalY,
      zoom,
    });
    onClose();
  };

  // 9-point rule-of-thirds grid points
  const gridPoints: { id: PhotoCropPosition; label: string; x: number; y: number }[] = [
    { id: 'top-left', label: 'Top-Left', x: 15, y: 15 },
    { id: 'top', label: 'Top-Center', x: 50, y: 15 },
    { id: 'top-right', label: 'Top-Right', x: 85, y: 15 },
    { id: 'left', label: 'Mid-Left', x: 15, y: 50 },
    { id: 'center', label: 'Center', x: 50, y: 50 },
    { id: 'right', label: 'Mid-Right', x: 85, y: 50 },
    { id: 'bottom-left', label: 'Bottom-Left', x: 15, y: 85 },
    { id: 'bottom', label: 'Bottom-Center', x: 50, y: 85 },
    { id: 'bottom-right', label: 'Bottom-Right', x: 85, y: 85 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in select-none">
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg shadow-2xl border border-cream-300 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-noir-900"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200 bg-[#FAF8F5]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-noir-900 text-foil-gold flex items-center justify-center shadow-xs">
              <Crop size={16} />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-noir-950 flex items-center gap-2">
                <span>Image Cut & Portion Selection</span>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-cream-200 text-noir-700">
                  {label || `Slot ${slotId}`}
                </span>
              </h3>
              <p className="text-xs text-noir-500">
                Choose which portion of this photo to display in the photobook slot without squeezing or distortion.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-noir-400 hover:text-noir-900 hover:bg-cream-200/60 rounded-full transition-colors"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto divide-y lg:divide-y-0 lg:divide-x divide-cream-200">
          {/* Main Visual Stage (Columns 1-7) */}
          <div className="lg:col-span-7 p-6 flex flex-col items-center justify-center bg-noir-950 relative">
            <div className="w-full mb-3 flex items-center justify-between text-xs text-cream-200 font-mono">
              <span className="flex items-center gap-1.5">
                <Grid3X3 size={14} className="text-foil-gold" />
                Click anywhere on the photo or 3×3 grid to set cut portion
              </span>
              <span className="text-cream-400">
                Focal: {focalX}% , {focalY}%
              </span>
            </div>

            {/* Interactive Image Frame with 3x3 Grid Overlay */}
            <div
              onClick={handleImageClick}
              className="relative max-w-full max-h-[360px] rounded-sm overflow-hidden border border-white/20 shadow-2xl cursor-crosshair group flex items-center justify-center bg-black/40"
            >
              <img
                src={photo.url}
                alt={label || 'Photo'}
                className="max-w-full max-h-[360px] object-contain pointer-events-none block"
              />

              {/* 3x3 Rule-of-Thirds Grid Overlay */}
              <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-white/40">
                <div className="border-r border-b border-white/30" />
                <div className="border-r border-b border-white/30" />
                <div className="border-b border-white/30" />
                <div className="border-r border-b border-white/30" />
                <div className="border-r border-b border-white/30" />
                <div className="border-b border-white/30" />
                <div className="border-r border-white/30" />
                <div className="border-r border-white/30" />
                <div className="" />
              </div>

              {/* Glowing Target Reticle on Selected Focal Point */}
              <div
                className="absolute w-8 h-8 -ml-4 -mt-4 border-2 border-foil-gold rounded-full pointer-events-none transition-all duration-200 shadow-[0_0_12px_rgba(212,175,55,0.8)] flex items-center justify-center bg-foil-gold/20"
                style={{ left: `${focalX}%`, top: `${focalY}%` }}
              >
                <div className="w-1.5 h-1.5 bg-white rounded-full shadow-xs" />
                {/* Crosshairs */}
                <div className="absolute -top-2 left-1/2 w-px h-2 bg-foil-gold" />
                <div className="absolute -bottom-2 left-1/2 w-px h-2 bg-foil-gold" />
                <div className="absolute top-1/2 -left-2 w-2 h-px bg-foil-gold" />
                <div className="absolute top-1/2 -right-2 w-2 h-px bg-foil-gold" />
              </div>

              {/* Hover Helper Pill */}
              <div className="absolute bottom-2 inset-x-0 mx-auto w-fit px-3 py-1 rounded-full bg-black/75 backdrop-blur-xs text-[10px] font-mono text-cream-200 pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity">
                Target: {activePreset.toUpperCase()} ({focalX}% X, {focalY}% Y)
              </div>
            </div>

            <p className="text-[11px] text-cream-400/80 mt-3 text-center">
              The camera reticle shows which region will be centered in your book slot.
            </p>
          </div>

          {/* Controls & Live Slot Result Preview (Columns 8-12) */}
          <div className="lg:col-span-5 p-6 flex flex-col justify-between bg-white space-y-5 overflow-y-auto">
            {/* 1. Quick Portion Presets for Wide & Tall Photos */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-noir-900 block mb-2 flex items-center gap-1.5">
                <Move size={13} className="text-foil-gold" />
                Quick Cut Presets
              </label>

              {/* Wide Image Cuts */}
              <div className="space-y-1.5 mb-3">
                <span className="text-[10px] font-semibold text-noir-500 uppercase tracking-wider block">
                  Horizontal Cuts (Wide Photos)
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => handleSelectPreset('left', 0, 50)}
                    className={`px-2.5 py-1.5 rounded-sm text-xs font-semibold border transition-all text-center ${
                      activePreset === 'left' || (focalX <= 20 && focalY === 50)
                        ? 'bg-noir-950 text-white border-noir-950 shadow-xs'
                        : 'border-cream-300 hover:bg-cream-100 text-noir-700'
                    }`}
                  >
                    Left Portion
                  </button>
                  <button
                    onClick={() => handleSelectPreset('center', 50, 50)}
                    className={`px-2.5 py-1.5 rounded-sm text-xs font-semibold border transition-all text-center ${
                      activePreset === 'center' || (focalX === 50 && focalY === 50)
                        ? 'bg-noir-950 text-white border-noir-950 shadow-xs'
                        : 'border-cream-300 hover:bg-cream-100 text-noir-700'
                    }`}
                  >
                    Center
                  </button>
                  <button
                    onClick={() => handleSelectPreset('right', 100, 50)}
                    className={`px-2.5 py-1.5 rounded-sm text-xs font-semibold border transition-all text-center ${
                      activePreset === 'right' || (focalX >= 80 && focalY === 50)
                        ? 'bg-noir-950 text-white border-noir-950 shadow-xs'
                        : 'border-cream-300 hover:bg-cream-100 text-noir-700'
                    }`}
                  >
                    Right Portion
                  </button>
                </div>
              </div>

              {/* Tall Image Cuts */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold text-noir-500 uppercase tracking-wider block">
                  Vertical Cuts (Tall Photos)
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => handleSelectPreset('top', 50, 0)}
                    className={`px-2.5 py-1.5 rounded-sm text-xs font-semibold border transition-all text-center ${
                      activePreset === 'top' || (focalY <= 20 && focalX === 50)
                        ? 'bg-noir-950 text-white border-noir-950 shadow-xs'
                        : 'border-cream-300 hover:bg-cream-100 text-noir-700'
                    }`}
                  >
                    Top Portion
                  </button>
                  <button
                    onClick={() => handleSelectPreset('center', 50, 50)}
                    className={`px-2.5 py-1.5 rounded-sm text-xs font-semibold border transition-all text-center ${
                      activePreset === 'center' || (focalX === 50 && focalY === 50)
                        ? 'bg-noir-950 text-white border-noir-950 shadow-xs'
                        : 'border-cream-300 hover:bg-cream-100 text-noir-700'
                    }`}
                  >
                    Center
                  </button>
                  <button
                    onClick={() => handleSelectPreset('bottom', 50, 100)}
                    className={`px-2.5 py-1.5 rounded-sm text-xs font-semibold border transition-all text-center ${
                      activePreset === 'bottom' || (focalY >= 80 && focalX === 50)
                        ? 'bg-noir-950 text-white border-noir-950 shadow-xs'
                        : 'border-cream-300 hover:bg-cream-100 text-noir-700'
                    }`}
                  >
                    Bottom Portion
                  </button>
                </div>
              </div>
            </div>

            {/* 2. 9-Point Rule-of-Thirds Grid Selector */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-noir-900 block mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Grid3X3 size={13} className="text-foil-gold" />
                  9-Point Grid Focal Selector
                </span>
                <span className="text-[10px] font-mono text-noir-400 capitalize">{activePreset}</span>
              </label>

              <div className="grid grid-cols-3 gap-1 bg-[#FAF8F5] p-2 rounded-sm border border-cream-200">
                {gridPoints.map((pt) => {
                  const isSelected = activePreset === pt.id;
                  return (
                    <button
                      key={pt.id}
                      onClick={() => handleSelectPreset(pt.id, pt.x, pt.y)}
                      className={`py-1.5 px-2 rounded-xs text-[11px] font-medium transition-all ${
                        isSelected
                          ? 'bg-foil-gold text-noir-950 font-bold shadow-xs'
                          : 'bg-white hover:bg-cream-200/70 text-noir-700 border border-cream-300'
                      }`}
                      title={pt.label}
                    >
                      {pt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Zoom / Scale Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-noir-900 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <ZoomIn size={13} className="text-foil-gold" />
                  Zoom & Crop Scale
                </span>
                <span className="font-mono text-xs font-semibold text-foil-gold bg-noir-950 px-2 py-0.5 rounded-full">
                  {zoom.toFixed(2)}×
                </span>
              </div>
              <input
                type="range"
                min="1.0"
                max="2.5"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-foil-gold cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-noir-400 font-mono mt-1">
                <span>1.0× (Standard)</span>
                <span>1.5×</span>
                <span>2.0×</span>
                <span>2.5× (Close-Up)</span>
              </div>
            </div>

            {/* 4. Real-Time Slot Result Preview */}
            <div className="border border-cream-300 rounded-sm p-3 bg-[#FAF8F5]">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-noir-500 mb-2">
                <span className="flex items-center gap-1">
                  <Layers size={11} className="text-foil-gold" />
                  Photobook Slot Live Preview
                </span>
                <span className="text-[9px] text-noir-400 font-mono">100% Zero-Squeeze</span>
              </div>
              <div className="w-full h-36 rounded-xs overflow-hidden border border-noir-300/60 bg-cream-100 shadow-inner relative flex items-center justify-center">
                <img
                  src={photo.url}
                  alt="Cropped Preview"
                  style={{
                    objectFit: 'cover',
                    objectPosition: `${focalX}% ${focalY}%`,
                    transform: `scale(${zoom})`,
                    transformOrigin: `${focalX}% ${focalY}%`,
                  }}
                  className="w-full h-full transition-all duration-200"
                />
                <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 backdrop-blur-xs rounded-xs text-[8px] font-mono text-white">
                  Result
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-cream-200">
              <button
                onClick={handleReset}
                className="flex items-center gap-1 text-xs text-noir-500 hover:text-noir-950 font-medium px-2 py-1.5 rounded-sm hover:bg-cream-100 transition-colors"
                title="Reset to center"
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-3.5 py-1.5 text-xs font-semibold text-noir-600 hover:text-noir-900 border border-cream-300 rounded-sm hover:bg-cream-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApply}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider bg-noir-950 text-white rounded-sm hover:bg-noir-900 transition-all shadow-xs"
                >
                  <Check size={13} className="text-foil-gold" />
                  <span>Apply Cut</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
