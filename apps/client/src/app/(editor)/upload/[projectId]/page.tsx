'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';

export default function UploadPage({ params }: { params: { projectId: string } }) {
  const router = useRouter();
  const [uploaded, setUploaded] = useState(0);
  const totalPhotos = 45;

  const handleContinue = () => {
    router.push(`/processing/${params.projectId}`);
  };

  return (
    <div className="min-h-screen bg-cream-50 font-sans text-noir-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="font-serif text-4xl mb-2">Upload Your Memories</h1>
        <p className="text-sm text-noir-600 mb-8 uppercase tracking-[0.2em]">Select photos for your book</p>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <div className="border-2 border-dashed border-cream-400 bg-white p-12 rounded-sm flex flex-col items-center justify-center text-center cursor-pointer hover:bg-cream-100 transition-colors">
              <div className="w-16 h-16 bg-cream-100 rounded-full flex items-center justify-center mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              </div>
              <button className="bg-noir-950 text-cream-50 px-6 py-3 rounded-sm mb-4">Upload Photos</button>
              <p className="text-noir-600 text-sm">Or drag and drop your photos here</p>
              <p className="text-xs text-noir-500 mt-2">Supports JPEG, PNG, HEIC, WebP</p>
            </div>

            <div className="mt-12">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-serif text-xl">Uploaded Photos ({uploaded})</h3>
                <div className="flex gap-4 text-sm">
                  <button className="hover:text-foil-gold">Select All</button>
                  <button className="text-red-500 hover:text-red-700">Delete Selected</button>
                </div>
              </div>
              
              {uploaded > 0 ? (
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {/* Photo grid mapping would go here */}
                </div>
              ) : (
                <div className="text-center py-12 text-noir-500 border border-cream-300 rounded-sm">
                  No photos uploaded yet
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1 space-y-4">
            <h3 className="font-serif text-xl mb-4">Import From</h3>
            {['Device', 'Google Photos', 'iCloud', 'Instagram'].map(source => (
              <button key={source} className="w-full bg-white border border-cream-300 p-4 rounded-sm flex items-center gap-4 hover:border-foil-gold transition-colors">
                <div className="w-8 h-8 bg-cream-100 rounded-sm flex items-center justify-center">
                  <span className="text-xs font-bold">{source[0]}</span>
                </div>
                <span>{source}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-cream-300 p-4 flex justify-between items-center z-10 px-8">
        <div>
          <p className="text-sm font-bold">{uploaded} / 150 Max Photos</p>
          <p className="text-xs text-red-500">Minimum 20 photos required</p>
        </div>
        <button 
          onClick={handleContinue}
          className="bg-noir-950 text-cream-50 px-8 py-3 rounded-sm font-medium tracking-wide disabled:opacity-50"
          disabled={uploaded < 20 && false} // disabled for testing
        >
          Continue to Smart Layout
        </button>
      </div>
    </div>
  );
}
