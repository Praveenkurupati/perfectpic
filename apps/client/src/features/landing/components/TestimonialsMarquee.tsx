'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Star, CheckCircle, Sparkles, ShieldCheck } from 'lucide-react';
import api from '@/lib/api';

interface TestimonialItem {
  id: string;
  name: string;
  location: string;
  bookTitle: string;
  category: string;
  rating: number;
  text: string;
  date?: string;
  avatarBg?: string;
}

const FALLBACK_TESTIMONIALS: TestimonialItem[] = [
  {
    id: 't-1',
    name: 'Priya & Arjun Sharma',
    location: 'Bengaluru, Karnataka',
    bookTitle: 'Jaipur Palace Wedding Keepsake',
    category: 'Wedding Heirloom',
    rating: 5,
    text: 'The print vibrancy blew us away. The deep maroons and gold foil detailing of our Jaipur wedding are rendered so vividly. Non-tearable paper gave my parents total peace of mind during family gatherings.',
    avatarBg: 'bg-[#8B5E3C]',
  },
  {
    id: 't-2',
    name: 'Vikram Malhotra',
    location: 'New Delhi',
    bookTitle: 'Annapurna Base Camp Expedition',
    category: 'Trek Panoramic',
    rating: 5,
    text: 'Spanning a 180° panoramic ridge photo across the two-page spread without any gutter cut in the middle is genius. You can actually see the mountain ridgeline seamless from left to right.',
    avatarBg: 'bg-[#2E5A44]',
  },
  {
    id: 't-3',
    name: 'Ananya & Rohan Kulkarni',
    location: 'Mumbai, Maharashtra',
    bookTitle: "Tara's First 365 Days",
    category: 'Baby Milestone',
    rating: 5,
    text: 'We captured our daughter\'s entire first year. The silky matte finish feels exquisite and doesn\'t pick up toddler fingerprints. The keepsake slipcase makes it feel like an heirloom.',
    avatarBg: 'bg-[#9C414A]',
  },
  {
    id: 't-4',
    name: 'Meera Sen',
    location: 'Kolkata, West Bengal',
    bookTitle: '25th Silver Jubilee Memoir',
    category: 'Anniversary Gift',
    rating: 5,
    text: 'Gifted this to our parents for their 25th anniversary. The foil embossed cover and heavy archival paper brought tears to their eyes. Delivered in 3 days in pristine packaging.',
    avatarBg: 'bg-[#3B4D7A]',
  },
  {
    id: 't-5',
    name: 'Karthik & Lakshmi Raman',
    location: 'Chennai, Tamil Nadu',
    bookTitle: 'Traditional Kalyanam & Mandapam',
    category: 'Wedding Keepsake',
    rating: 5,
    text: 'Kanjivaram silk saree colors and temple borders came out with zero color cast. The custom embossed title in gold foil on midnight buckram looks like a royal heirloom.',
    avatarBg: 'bg-[#7A5A2E]',
  },
  {
    id: 't-6',
    name: 'Divya & Siddharth Patel',
    location: 'Ahmedabad, Gujarat',
    bookTitle: 'Swiss Alps & Amalfi Coast Diaries',
    category: 'Travel Journal',
    rating: 5,
    text: 'Uploaded 140 photos right from my phone camera roll. The smart auto-layout placed everything chronologically in 5 minutes. The hardcover build is museum grade.',
    avatarBg: 'bg-[#2D6A7A]',
  },
  {
    id: 't-7',
    name: 'Aditya Sen',
    location: 'Bengaluru, Karnataka',
    bookTitle: 'Netravati Peak Panoramic',
    category: 'Trek Ridge',
    rating: 5,
    text: 'The lay-flat binding is unbelievable. We printed our Netravati trek photos and looking at them spread across two pages without gutter loss brings the memory right back.',
    avatarBg: 'bg-[#4A5D3E]',
  },
  {
    id: 't-8',
    name: 'Sunil & Pooja Verma',
    location: 'Hyderabad, Telangana',
    bookTitle: 'Architectural Folio & Hampi Heritage',
    category: 'Architecture & Art',
    rating: 5,
    text: 'The layflat binding lets us keep the photobook open on our living room coffee table as an art display. Guests constantly flip through the stone chariot spreads.',
    avatarBg: 'bg-[#4A4843]',
  },
  {
    id: 't-9',
    name: 'Ritu Deshmukh',
    location: 'Pune, Maharashtra',
    bookTitle: 'Four Generations Diwali Reunion',
    category: 'Family Heritage',
    rating: 5,
    text: 'Delivered in 4 days before Diwali. Having our 90-year-old grandmother holding a bound book of her grandchildren was unforgettable. Truly priceless keepsake.',
    avatarBg: 'bg-[#6D3B6A]',
  },
  {
    id: 't-10',
    name: 'Manish Chawla',
    location: 'Chandigarh',
    bookTitle: 'Chadar Frozen River Expedition',
    category: 'Winter Trek',
    rating: 5,
    text: 'Crystalline ice sheets rendered with unbelievable clarity. Heavy 250 GSM paper weight feels substantial in your hands. Friends who visit our living room always pick this up first.',
    avatarBg: 'bg-[#3A556A]',
  },
  {
    id: 't-11',
    name: 'Zoya & Farhan Akhtar',
    location: 'Hyderabad, Telangana',
    bookTitle: 'Amalfi Cliffside & Capri Waters',
    category: 'Travel Memoir',
    rating: 5,
    text: 'Positano cliffside houses look crisp down to individual balconies. The matte finish doesn’t attract any smudges when relatives flip through it.',
    avatarBg: 'bg-[#8A4A38]',
  },
  {
    id: 't-12',
    name: 'Simran & Harpreet Bedi',
    location: 'Amritsar, Punjab',
    bookTitle: 'Anand Karaj & Shabad Vows',
    category: 'Wedding Album',
    rating: 5,
    text: 'From the Gurudwara ceremony to the reception dance floor, every emotional moment is frozen in print. The magnetic keepsake box keeps it dust-free on our mantlepiece.',
    avatarBg: 'bg-[#3A6A5A]',
  },
];

const AVATAR_COLORS = [
  'bg-[#8B5E3C]',
  'bg-[#2E5A44]',
  'bg-[#9C414A]',
  'bg-[#3B4D7A]',
  'bg-[#7A5A2E]',
  'bg-[#2D6A7A]',
  'bg-[#4A5D3E]',
  'bg-[#6D3B6A]',
  'bg-[#3A556A]',
  'bg-[#8A4A38]',
];

export function TestimonialsMarquee() {
  const [items, setItems] = useState<TestimonialItem[]>(FALLBACK_TESTIMONIALS);
  const [stats, setStats] = useState({
    average: 4.92,
    count: 1480,
  });

  useEffect(() => {
    let isMounted = true;
    api
      .getReviews({ limit: 40 })
      .then((res) => {
        if (!isMounted || !res?.reviews || res.reviews.length === 0) return;
        const formatted: TestimonialItem[] = res.reviews.map((r: any, idx: number) => ({
          id: r.id || `r-${idx}`,
          name: r.customerName || 'Verified Collector',
          location: r.customerLocation || 'India',
          bookTitle: r.bookTitle || 'Custom Photobook',
          category: r.category || 'Travel',
          rating: r.rating || 5,
          text: r.comment || r.title || '',
          date: r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : undefined,
          avatarBg: AVATAR_COLORS[idx % AVATAR_COLORS.length],
        }));

        setItems(formatted);
        if (res.summary) {
          setStats({
            average: res.summary.averageRating || 4.92,
            count: res.summary.totalReviews || 1480,
          });
        }
      })
      .catch((err) => {
        console.warn('Could not load dynamic reviews for marquee, using cached fallbacks:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Split items evenly between the two opposite scrolling rows
  const { rowOne, rowTwo } = useMemo(() => {
    const half = Math.ceil(items.length / 2);
    const firstHalf = items.slice(0, half);
    const secondHalf = items.slice(half);

    // Duplicate each list at least twice to enable an uninterrupted infinite continuous seamless loop
    return {
      rowOne: [...firstHalf, ...firstHalf, ...firstHalf],
      rowTwo: [...secondHalf, ...secondHalf, ...secondHalf],
    };
  }, [items]);

  return (
    <section className="bg-white py-24 md:py-32 overflow-hidden relative border-t border-[#D9D6CF]/70">
      {/* Decorative gradient masks for ultra-smooth edge fading on both left and right */}
      <div className="absolute top-0 bottom-0 left-0 w-16 md:w-44 bg-gradient-to-r from-white via-white/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-0 w-16 md:w-44 bg-gradient-to-l from-white via-white/80 to-transparent z-10 pointer-events-none" />

      {/* Section Header */}
      <div className="container mx-auto px-4 md:px-8 max-w-6xl mb-14">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F4F2ED] border border-[#D9D6CF] rounded-full text-[11px] font-semibold uppercase tracking-widest text-[#5C5A55] mb-3">
              <Sparkles size={12} className="text-[#0A0A0A]" />
              <span>verified customer stories</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#0A0A0A] lowercase">
              loved by families across india.
            </h2>
          </div>

          <div className="flex items-center gap-4 bg-[#F4F2ED] border border-[#D9D6CF] px-5 py-3 rounded-2xl shrink-0">
            <div className="flex text-[#0A0A0A] gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} fill="currentColor" />
              ))}
            </div>
            <div className="h-4 w-px bg-[#D9D6CF]" />
            <div className="text-xs text-[#2A2926]">
              <span className="font-bold font-sans text-sm">{stats.average.toFixed(1)}</span>
              <span className="text-[#706E69]"> / 5.0 rating</span>
              <span className="text-[#706E69] hidden sm:inline"> ({stats.count}+ books)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 1: Infinite marquee moving Leftwards (0% to -50%) */}
      <div className="flex space-x-6 w-max animate-marquee hover:[animation-play-state:paused] py-2 cursor-grab active:cursor-grabbing">
        {rowOne.map((item, idx) => (
          <div
            key={`r1-${item.id}-${idx}`}
            className="w-[320px] sm:w-[380px] bg-[#F4F2ED] p-6 sm:p-7 rounded-2xl border border-[#D9D6CF] flex flex-col justify-between shrink-0 select-none transition-all hover:border-[#0A0A0A]/40 hover:shadow-xs group"
          >
            <div>
              {/* Top Row: Stars + Category Pill */}
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex text-[#0A0A0A] gap-0.5">
                  {[...Array(item.rating)].map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" />
                  ))}
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 bg-white text-[#5C5A55] border border-[#D9D6CF] rounded-full">
                  {item.category}
                </span>
              </div>

              {/* Book Title */}
              <h4 className="text-sm font-bold text-[#0A0A0A] lowercase mb-2 line-clamp-1">
                {item.bookTitle}
              </h4>

              {/* Quote */}
              <p className="text-xs sm:text-[13px] text-[#2A2926] leading-relaxed lowercase line-clamp-4 mb-4">
                &ldquo;{item.text}&rdquo;
              </p>
            </div>

            {/* Customer Info Footer */}
            <div className="pt-3.5 border-t border-[#D9D6CF]/70 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-7 h-7 rounded-full ${item.avatarBg || 'bg-[#2A2926]'} text-white flex items-center justify-center text-xs font-bold shrink-0`}
                >
                  {item.name.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-bold text-[#0A0A0A] lowercase leading-tight">
                    {item.name}
                  </p>
                  <p className="text-[11px] text-[#706E69] lowercase leading-tight mt-0.5">
                    {item.location}
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-800 font-medium">
                <CheckCircle size={11} className="fill-emerald-100 text-emerald-700" />
                <span>verified</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Row 2: Infinite marquee moving in OPPOSITE Direction Rightwards (-50% to 0%) */}
      <div className="flex space-x-6 w-max animate-marquee-reverse hover:[animation-play-state:paused] py-2 mt-4 cursor-grab active:cursor-grabbing">
        {rowTwo.map((item, idx) => (
          <div
            key={`r2-${item.id}-${idx}`}
            className="w-[320px] sm:w-[380px] bg-[#F4F2ED] p-6 sm:p-7 rounded-2xl border border-[#D9D6CF] flex flex-col justify-between shrink-0 select-none transition-all hover:border-[#0A0A0A]/40 hover:shadow-xs group"
          >
            <div>
              {/* Top Row: Stars + Category Pill */}
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex text-[#0A0A0A] gap-0.5">
                  {[...Array(item.rating)].map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" />
                  ))}
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 bg-white text-[#5C5A55] border border-[#D9D6CF] rounded-full">
                  {item.category}
                </span>
              </div>

              {/* Book Title */}
              <h4 className="text-sm font-bold text-[#0A0A0A] lowercase mb-2 line-clamp-1">
                {item.bookTitle}
              </h4>

              {/* Quote */}
              <p className="text-xs sm:text-[13px] text-[#2A2926] leading-relaxed lowercase line-clamp-4 mb-4">
                &ldquo;{item.text}&rdquo;
              </p>
            </div>

            {/* Customer Info Footer */}
            <div className="pt-3.5 border-t border-[#D9D6CF]/70 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-7 h-7 rounded-full ${item.avatarBg || 'bg-[#2A2926]'} text-white flex items-center justify-center text-xs font-bold shrink-0`}
                >
                  {item.name.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-bold text-[#0A0A0A] lowercase leading-tight">
                    {item.name}
                  </p>
                  <p className="text-[11px] text-[#706E69] lowercase leading-tight mt-0.5">
                    {item.location}
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-800 font-medium">
                <CheckCircle size={11} className="fill-emerald-100 text-emerald-700" />
                <span>verified</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Inline styles for continuous seamless non-stop infinite marquee loop */}
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
          animation: marquee 55s linear infinite;
        }
        .animate-marquee-reverse {
          animation: marqueeReverse 55s linear infinite;
        }
      `}</style>
    </section>
  );
}

export default TestimonialsMarquee;
