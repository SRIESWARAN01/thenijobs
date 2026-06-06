'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react';
import { limit, where } from 'firebase/firestore';
import { useCollection } from '@/hooks/useFirestore';

export default function TestimonialsSection() {
  const [current, setCurrent] = useState(0);
  const { data: reviews, loading } = useCollection<any>('reviews', [
    where('status', '==', 'approved'),
    limit(6),
  ]);

  useEffect(() => {
    setCurrent(0);
  }, [reviews.length]);

  if (loading || reviews.length === 0) {
    return null;
  }

  const prev = () => setCurrent((value) => (value - 1 + reviews.length) % reviews.length);
  const next = () => setCurrent((value) => (value + 1) % reviews.length);
  const active = reviews[current];
  const reviewerName = active.reviewerName || 'Verified user';
  const rating = Math.max(1, Math.min(5, Number(active.rating || 5)));

  return (
    <section className="px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 text-center">
          <p className="text-xs font-black uppercase text-teal-700">Community</p>
          <h2 className="mt-1 font-outfit text-2xl font-black text-slate-950 sm:text-3xl">
            People using THENIJOBS
          </h2>
          <p className="mt-1 text-sm text-slate-500">Approved reviews from real platform users.</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-sm sm:p-8">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
            <Quote size={22} />
          </div>
          <div className="mb-4 flex justify-center">
            {Array.from({ length: rating }).map((_, index) => (
              <Star key={index} size={18} className="fill-amber-400 text-amber-400" />
            ))}
          </div>
          <blockquote className="mx-auto mb-6 max-w-2xl text-base font-semibold leading-8 text-slate-700 sm:text-lg">
            &quot;{active.content || active.text || active.title || 'Good experience with THENIJOBS.'}&quot;
          </blockquote>
          <div className="flex items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-lg font-black text-white">
              {reviewerName.charAt(0).toUpperCase()}
            </div>
            <div className="text-left">
              <div className="font-black text-slate-950">{reviewerName}</div>
              <div className="text-sm font-semibold text-slate-500">
                {active.targetName || active.targetType || 'THENIJOBS user'}
              </div>
            </div>
          </div>
        </div>

        {reviews.length > 1 && (
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
              {reviews.map((item, index) => (
                <button
                  key={item.id}
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
        )}
      </div>
    </section>
  );
}
