'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Murugan K.',
    role: 'Tractor Driver',
    location: 'Theni',
    text: 'THENIJOBS-ல் 3 நாளில் வேலை கிடைத்தது. Call button, WhatsApp எல்லாம் easy-ஆ இருந்தது.',
    rating: 5,
    avatar: 'M',
  },
  {
    name: 'Priya S.',
    role: 'HR Manager',
    company: 'Theni Textiles Ltd',
    location: 'Theni',
    text: 'We hired 12 employees within a month. Candidate search and job posting are simple for our team.',
    rating: 5,
    avatar: 'P',
  },
  {
    name: 'Selvam R.',
    role: 'Business Owner',
    company: 'Arasu Pandi Farm Services',
    location: 'Theni',
    text: 'Company page வந்த பிறகு calls and leads அதிகமா வந்தது. Local customers கண்டுபிடிக்க useful.',
    rating: 5,
    avatar: 'S',
  },
  {
    name: 'Kavitha M.',
    role: 'School Teacher',
    location: 'Bodinayakanur',
    text: 'Mobile-ல் jobs பார்க்கவும் apply பண்ணவும் clear-ஆ இருந்தது. Tamil labels helpful.',
    rating: 5,
    avatar: 'K',
  },
];

export default function TestimonialsSection() {
  const [current, setCurrent] = useState(0);

  const prev = () => setCurrent((value) => (value - 1 + testimonials.length) % testimonials.length);
  const next = () => setCurrent((value) => (value + 1) % testimonials.length);
  const active = testimonials[current];

  return (
    <section className="px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 text-center">
          <p className="text-xs font-black uppercase text-teal-700">Community</p>
          <h2 className="mt-1 font-outfit text-2xl font-black text-slate-950 sm:text-3xl">
            People using THENIJOBS
          </h2>
          <p className="mt-1 text-sm text-slate-500">Job seekers and business owners share one local platform.</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-sm sm:p-8">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
            <Quote size={22} />
          </div>
          <div className="mb-4 flex justify-center">
            {Array.from({ length: active.rating }).map((_, index) => (
              <Star key={index} size={18} className="fill-amber-400 text-amber-400" />
            ))}
          </div>
          <blockquote className="mx-auto mb-6 max-w-2xl text-base font-semibold leading-8 text-slate-700 sm:text-lg">
            &quot;{active.text}&quot;
          </blockquote>
          <div className="flex items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-lg font-black text-white">
              {active.avatar}
            </div>
            <div className="text-left">
              <div className="font-black text-slate-950">{active.name}</div>
              <div className="text-sm font-semibold text-slate-500">
                {active.role}
                {active.company && ` - ${active.company}`}
                {` - ${active.location}`}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={prev}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
            aria-label="Previous testimonial"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex gap-2">
            {testimonials.map((item, index) => (
              <button
                key={item.name}
                type="button"
                onClick={() => setCurrent(index)}
                className={`h-2 rounded-full transition-all ${index === current ? 'w-8 bg-teal-700' : 'w-2 bg-slate-300'}`}
                aria-label={`Show testimonial ${index + 1}`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={next}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
            aria-label="Next testimonial"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </section>
  );
}
