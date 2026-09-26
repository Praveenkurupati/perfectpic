'use client';

import { useEffect, useRef } from 'react';
import { useEditorStore } from '@/stores/useEditorStore';

export default function BookCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { setCanvas } = useEditorStore();

  useEffect(() => {
    // Simulated Fabric.js initialization
    if (canvasRef.current) {
      console.log('Canvas initialized');
      setCanvas({ simulated: true });
    }
  }, [setCanvas]);

  return (
    <div className="relative shadow-book-spread bg-white rounded-sm flex" style={{ width: '800px', height: '400px' }}>
      {/* Left Page */}
      <div className="flex-1 border-r border-black/5 relative overflow-hidden group">
        {/* Safe Zone Guide */}
        <div className="absolute inset-4 border border-dashed border-red-300 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50" />
        {/* Mock Photo Well */}
        <div className="absolute top-8 left-8 right-4 bottom-8 bg-cream-100 flex items-center justify-center border-2 border-dashed border-cream-300">
          <span className="text-cream-400 text-sm">Drag photo here</span>
        </div>
      </div>
      
      {/* Spine Shadow */}
      <div className="absolute inset-y-0 left-1/2 -ml-4 w-8 bg-gradient-to-r from-transparent via-black/10 to-transparent pointer-events-none z-40" />

      {/* Right Page */}
      <div className="flex-1 relative overflow-hidden group">
        {/* Safe Zone Guide */}
        <div className="absolute inset-4 border border-dashed border-red-300 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50" />
        {/* Mock Photo Well */}
        <div className="absolute top-8 left-4 right-8 bottom-8 bg-cream-100 flex items-center justify-center border-2 border-dashed border-cream-300">
          <span className="text-cream-400 text-sm">Drag photo here</span>
        </div>
      </div>
    </div>
  );
}
