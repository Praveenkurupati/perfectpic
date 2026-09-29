'use client';

import React from 'react';
import { Star, CheckCircle, Quote, Sparkles } from 'lucide-react';

interface Testimonial {
  id: string;
  name: string;
  location: string;
  bookTitle: string;
  category: string;
  rating: number;
  text: string;
  date: string;
  avatarBg: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: 't-1',
    name: 'Priya & Arjun Sharma',
    location: 'Bengaluru, Karnataka',
    bookTitle: 'Jaipur Palace Wedding Keepsake',
    category: 'Wedding Heirloom',
    rating: 5,
    text: 'The print vibrancy blew us away. The deep maroons and gold foil detailing of our Jaipur wedding are rendered so vividly. Non-tearable paper gave my parents total peace of mind during family gatherings.',
    date: 'September 2026',
    avatarBg: 'bg-amber-700',
  },
  {
    id: 't-2',
    name: 'Vikram Malhotra',
    location: 'New Delhi',
    bookTitle: 'Annapurna & Kudremukh Expedition',
    category: 'Trek Panoramic',
    rating: 5,
    text: 'Spanning a 180° panoramic ridge photo across the two-page spread without any gutter cut in the middle is genius. You can actually see the mountain ridgeline seamless from left to right.',
    date: 'September 2026',
    avatarBg: 'bg-emerald-800',
  },
  {
    id: 't-3',
    name: 'Ananya & Rohan Kulkarni',
    location: 'Mumbai, Maharashtra',
    bookTitle: 'Tara\'s First 365 Days',
    category: 'Baby Milestone',
    rating: 5,
    text: 'We captured our daughter\'s entire first year. The silky matte finish feels exquisite and doesn\'t pick up toddler fingerprints. The keepsake slipcase makes it feel like an heirloom.',
    date: 'August 2026',
    avatarBg: 'bg-rose-700',
  },
  {
    id: 't-4',
    name: 'Meera Sen',
    location: 'Kolkata, West Bengal',
    bookTitle: '25th Silver Jubilee Memoir',
    category: 'Anniversary Gift',
    rating: 5,
    text: 'Gifted this to our parents for their 25th anniversary. The foil embossed cover and heavy archival paper brought tears to their eyes. Delivered in 3 days in pristine packaging.',
    date: 'August 2026',
    avatarBg: 'bg-indigo-800',
  },
  {
    id: 't-5',
    name: 'Karthik Raman',
    location: 'Chennai, Tamil Nadu',
    bookTitle: 'Kabini & Western Ghats Wildlife',
    category: 'Nature & Wildlife',
    rating: 5,
    text: 'As an amateur wildlife photographer, color calibration is everything. The greens of the Nilgiri rainforest and black panther eyes came out razor-sharp with the 12K Indigo print.',
    date: 'July 2026',
    avatarBg: 'bg-teal-800',
  },
  {
    id: 't-6',
    name: 'Divya & Siddharth Patel',
    location: 'Ahmedabad, Gujarat',
    bookTitle: 'Swiss Alps & Amalfi Coast Diaries',
    category: 'Travel Journal',
    rating: 5,
    text: 'Uploaded 140 photos right from my phone camera roll. The smart auto-layout placed everything chronologically in 5 minutes. The hardcover build is museum grade.',
    date: 'July 2026',
    avatarBg: 'bg-sky-800',
  },
  {
    id: 't-7',
    name: 'Sunil & Pooja Verma',
    location: 'Hyderabad, Telangana',
    bookTitle: 'Architectural Folio & Hampi Heritage',
    category: 'Architecture & Art',
    rating: 5,
    text: 'The layflat binding lets us keep the photobook open on our living room coffee table as an art display. Guests constantly flip through the stone chariot spreads.',
    date: 'June 2026',
    avatarBg: 'bg-stone-800',
  },
  {
    id: 't-8',
    name: 'Ritu Deshmukh',
    location: 'Pune, Maharashtra',
    bookTitle: 'Four Generations Diwali Reunion',
    category: 'Family Heritage',
    rating: 5,
    text: 'Delivered in 4 days before Diwali. Having our 90-year-old grandmother holding a bound book of her grandchildren was unforgettable. Truly priceless keepsake.',
    date: 'June 2026',
    avatarBg: 'bg-purple-800',
  },
];

export function TestimonialsMarquee() {
  // We duplicate the array to achieve an uninterrupted seamless infinite loop
  const rowOne = [...TESTIMONIALS, ...TESTIMONIALS];
  const rowTwo = [...TESTIMONIALS.slice(4), ...TESTIMONIALS.slice(0, 4), ...TESTIMONIALS.slice(4), ...TESTIMONIALS.slice(0, 4)];

  return (
    <section className="py-24 bg-cream-50 border-t border-cream-200 overflow-hidden relative">
      {/* Decorative gradient masks for ultra-smooth edge fading */}
      <div className="absolute top-0 bottom-0 left-0 w-20 md:w-36 bg-gradient-to-r from-cream-50 to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-0 w-20 md:w-36 bg-gradient-to-l from-cream-50 to-transparent z-10 pointer-events-none" />

      <div className="container mx-auto px-4 md:px-8 max-w-6xl mb-14 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-cream-200/80 border border-cream-300 rounded-full text-xs font-semibold uppercase tracking-wider text-noir-800 mb-4">
          <Sparkles size={13} className="text-foil-gold" />
          <span>Real Experiences Across India</span>
        </div>

        <h2 className="font-serif text-3xl md:text-5xl font-medium text-noir-950 mb-4">
          Cherished by 10,000+ Explorers & Families
        </h2>

        <div className="flex items-center justify-center gap-3 text-noir-900">
          <div className="flex text-amber-500">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} size={20} className="fill-amber-500 text-amber-500" />
            ))}
          </div>
          <span className="font-bold text-lg text-noir-900">4.9 / 5.0</span>
          <span className="text-noir-500 text-sm">• Verified Collector Reviews</span>
        </div>
      </div>

      {/* Row 1: Infinite marquee moving Left */}
      <div className="flex space-x-6 w-max animate-marquee hover:[animation-play-state:paused] py-2">
        {rowOne.map((item, idx) => (
          <div
            key={`row1-${item.id}-${idx}`}
            className="w-[340px] sm:w-[380px] bg-white p-6 rounded-sm border border-cream-300 shadow-luxury-xs hover:shadow-luxury-md hover:border-foil-gold/60 transition-all flex flex-col justify-between shrink-0 select-none group"
          >
            <div>
              {/* Top Row: Stars + Category Pill */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex text-amber-500">
                  {[...Array(item.rating)].map((_, i) => (
                    <Star key={i} size={15} className="fill-amber-500 text-amber-500" />
                  ))}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-cream-100 text-noir-800 border border-cream-200 rounded-full">
                  {item.category}
                </span>
              </div>

              {/* Book Title */}
              <h4 className="font-serif text-base font-semibold text-noir-900 mb-2 truncate">
                {item.bookTitle}
              </h4>

              {/* Quote */}
              <p className="text-xs text-noir-700 leading-relaxed italic line-clamp-4 mb-4">
                &ldquo;{item.text}&rdquo;
              </p>
            </div>

            {/* Customer Info Footer */}
            <div className="pt-3 border-t border-cream-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full ${item.avatarBg} text-cream-50 flex items-center justify-center font-serif text-xs font-bold shrink-0 shadow-sm`}>
                  {item.name.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-semibold text-noir-900 leading-tight">
                    {item.name}
                  </p>
                  <p className="text-[11px] text-noir-500 leading-tight">
                    {item.location}
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-medium">
                <CheckCircle size={11} className="fill-emerald-100 text-emerald-600" />
                Verified
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Row 2: Infinite marquee moving in reverse (Right) */}
      <div className="flex space-x-6 w-max animate-marquee-reverse hover:[animation-play-state:paused] py-2 mt-4">
        {rowTwo.map((item, idx) => (
          <div
            key={`row2-${item.id}-${idx}`}
            className="w-[340px] sm:w-[380px] bg-white p-6 rounded-sm border border-cream-300 shadow-luxury-xs hover:shadow-luxury-md hover:border-foil-gold/60 transition-all flex flex-col justify-between shrink-0 select-none group"
          >
            <div>
              {/* Top Row: Stars + Category Pill */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex text-amber-500">
                  {[...Array(item.rating)].map((_, i) => (
                    <Star key={i} size={15} className="fill-amber-500 text-amber-500" />
                  ))}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-cream-100 text-noir-800 border border-cream-200 rounded-full">
                  {item.category}
                </span>
              </div>

              {/* Book Title */}
              <h4 className="font-serif text-base font-semibold text-noir-900 mb-2 truncate">
                {item.bookTitle}
              </h4>

              {/* Quote */}
              <p className="text-xs text-noir-700 leading-relaxed italic line-clamp-4 mb-4">
                &ldquo;{item.text}&rdquo;
              </p>
            </div>

            {/* Customer Info Footer */}
            <div className="pt-3 border-t border-cream-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full ${item.avatarBg} text-cream-50 flex items-center justify-center font-serif text-xs font-bold shrink-0 shadow-sm`}>
                  {item.name.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-semibold text-noir-900 leading-tight">
                    {item.name}
                  </p>
                  <p className="text-[11px] text-noir-500 leading-tight">
                    {item.location}
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-medium">
                <CheckCircle size={11} className="fill-emerald-100 text-emerald-600" />
                Verified
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Inline styles for the infinite continuous marquee animation */}
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        @keyframes marqueeReverse {
          0% {
            transform: translateX(-50%);
          }
          100% {
            transform: translateX(0%);
          }
        }
        .animate-marquee {
          animation: marquee 45s linear infinite;
        }
        .animate-marquee-reverse {
          animation: marqueeReverse 45s linear infinite;
        }
      `}</style>
    </section>
  );
}

export default TestimonialsMarquee;
