'use client';

export default function BookFlipPreview() {
  return (
    <div className="relative shadow-2xl shadow-black/50" style={{ width: '800px', height: '500px' }}>
      {/* Mock 3D Book representation since react-pageflip requires complex setup */}
      <div className="absolute inset-0 bg-cream-50 rounded-sm flex">
        <div className="flex-1 border-r border-black/10 relative shadow-inner">
          <div className="absolute inset-8 bg-cream-200 flex items-center justify-center">
            <span className="text-noir-500 font-serif text-2xl">Page 4</span>
          </div>
        </div>
        <div className="w-12 absolute left-1/2 -ml-6 inset-y-0 bg-gradient-to-r from-black/20 via-transparent to-black/10 z-10 pointer-events-none" />
        <div className="flex-1 relative shadow-inner">
          <div className="absolute inset-8 bg-cream-200 flex items-center justify-center">
            <span className="text-noir-500 font-serif text-2xl">Page 5</span>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-noir-400 text-sm italic">
        * Interactive 3D flip preview simulated
      </div>
    </div>
  );
}
