'use client';

import { useState } from 'react';

const panels = ['Layouts', 'Cover', 'Text', 'Backgrounds'];

export default function EditorToolbar() {
  const [activePanel, setActivePanel] = useState('Layouts');

  return (
    <div className="flex flex-col h-full">
      {panels.map((panel) => (
        <div key={panel} className="border-b border-cream-300">
          <button 
            onClick={() => setActivePanel(activePanel === panel ? '' : panel)}
            className="w-full px-4 py-3 flex justify-between items-center text-sm font-medium uppercase tracking-wider hover:bg-cream-50"
          >
            {panel}
            <span>{activePanel === panel ? '−' : '+'}</span>
          </button>
          
          {activePanel === panel && (
            <div className="p-4 bg-cream-50/50">
              {panel === 'Layouts' && (
                <div className="grid grid-cols-2 gap-2">
                  {[1,2,3,4,6].map(num => (
                    <div key={num} className="aspect-square bg-white border border-cream-300 rounded-sm flex items-center justify-center text-xs hover:border-foil-gold cursor-pointer">
                      {num} Photo
                    </div>
                  ))}
                </div>
              )}
              {panel === 'Cover' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-noir-600 block mb-1">Title</label>
                    <input type="text" className="w-full border border-cream-300 p-2 text-sm rounded-sm bg-white" placeholder="Our Wedding" />
                  </div>
                  <div>
                    <label className="text-xs text-noir-600 block mb-1">Subtitle</label>
                    <input type="text" className="w-full border border-cream-300 p-2 text-sm rounded-sm bg-white" placeholder="2026" />
                  </div>
                </div>
              )}
              {panel === 'Backgrounds' && (
                <div className="grid grid-cols-4 gap-2">
                  {['#FAF8F5', '#F4F0E8', '#DFD7C7', '#C5A880', '#141413'].map(color => (
                    <div key={color} className="aspect-square rounded-sm border border-cream-300 cursor-pointer shadow-sm" style={{ backgroundColor: color }} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
