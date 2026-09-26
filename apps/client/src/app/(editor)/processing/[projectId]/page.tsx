'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';

const steps = [
  "Sorting your timeline...",
  "Detecting faces and focal points...",
  "Balancing color stories...",
  "Generating your book layout..."
];

export default function ProcessingPage({ params }: { params: { projectId: string } }) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            router.push(`/studio/${params.projectId}`);
          }, 1500);
          return 100;
        }
        return p + 1;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [params.projectId, router]);

  useEffect(() => {
    if (progress > 25 && currentStep === 0) setCurrentStep(1);
    if (progress > 50 && currentStep === 1) setCurrentStep(2);
    if (progress > 75 && currentStep === 2) setCurrentStep(3);
  }, [progress, currentStep]);

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center font-sans text-noir-900 p-8">
      <div className="max-w-md w-full space-y-12">
        
        <div className="relative w-48 h-48 mx-auto">
           {/* Abstract book illustration animation */}
           <motion.div 
             className="absolute inset-0 bg-cream-100 border-2 border-noir-900 rounded-r-md shadow-book-spread origin-left"
             animate={{ rotateY: [0, -10, 0] }}
             transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
           />
           <div className="absolute inset-y-4 inset-x-8 flex flex-col gap-2">
             <motion.div className="h-1/2 bg-cream-300 rounded-sm" style={{ scaleX: progress / 100 }} originX={0} />
             <div className="flex gap-2 h-1/2">
               <motion.div className="flex-1 bg-cream-300 rounded-sm" style={{ scaleX: Math.max(0, (progress - 50) * 2) / 100 }} originX={0} />
               <motion.div className="flex-1 bg-cream-300 rounded-sm" style={{ scaleX: Math.max(0, (progress - 75) * 4) / 100 }} originX={0} />
             </div>
           </div>
        </div>

        <div className="text-center space-y-2 h-16">
          <AnimatePresence mode="wait">
            <motion.h2 
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="font-serif text-2xl"
            >
              {progress === 100 ? "Your 32-page photobook is ready!" : steps[currentStep]}
            </motion.h2>
          </AnimatePresence>
        </div>

        <div className="space-y-6">
          <div className="h-1 w-full bg-cream-300 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-foil-gold"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <div className="space-y-3">
            {steps.map((step, idx) => (
              <div key={idx} className={`flex items-center gap-3 text-sm ${idx > currentStep ? 'text-noir-400' : 'text-noir-900'}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${idx <= currentStep ? (idx < currentStep ? 'bg-foil-gold border-foil-gold text-white' : 'border-foil-gold text-foil-gold') : 'border-cream-400'}`}>
                  {idx < currentStep ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : (
                    <div className={`w-2 h-2 rounded-full ${idx === currentStep ? 'bg-foil-gold animate-pulse' : 'bg-transparent'}`} />
                  )}
                </div>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
