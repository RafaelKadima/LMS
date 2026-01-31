'use client';

import { useRef, useState, useEffect, ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CourseRowProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function CourseRow({ title, children, className }: CourseRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  };

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.8;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollButtons);
    updateScrollButtons();
    const observer = new ResizeObserver(updateScrollButtons);
    observer.observe(el);
    return () => {
      el.removeEventListener('scroll', updateScrollButtons);
      observer.disconnect();
    };
  }, []);

  return (
    <section className={className}>
      <h2 className="text-xl md:text-2xl font-display font-bold mb-3">
        {title}
      </h2>
      <div className="group/row relative -mx-1">
        {/* Left arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-0 bottom-4 z-10 w-12 md:w-14
                       bg-gradient-to-r from-surface-dark/90 to-transparent
                       opacity-0 group-hover/row:opacity-100 transition-opacity duration-200
                       flex items-center justify-start pl-1
                       hidden md:flex"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-7 h-7 text-white/80" />
          </button>
        )}

        {/* Scroll container */}
        <div
          ref={scrollRef}
          className="flex gap-2 md:gap-3 overflow-x-auto overflow-y-visible pb-4 px-1
                     scrollbar-hide scroll-smooth scroll-snap-x"
        >
          {children}
        </div>

        {/* Right arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-0 bottom-4 z-10 w-12 md:w-14
                       bg-gradient-to-l from-surface-dark/90 to-transparent
                       opacity-0 group-hover/row:opacity-100 transition-opacity duration-200
                       flex items-center justify-end pr-1
                       hidden md:flex"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-7 h-7 text-white/80" />
          </button>
        )}
      </div>
    </section>
  );
}
