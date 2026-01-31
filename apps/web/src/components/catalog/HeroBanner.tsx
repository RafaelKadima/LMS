'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Play, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HeroCourse {
  id: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  durationMinutes: number;
  lessonsCount: number;
  isRequired?: boolean;
}

interface HeroBannerProps {
  courses: HeroCourse[];
}

const ROTATION_INTERVAL = 10000; // 10 seconds per course

export function HeroBanner({ courses }: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const course = courses[currentIndex];
  const hasVideo = !!course?.videoUrl;

  const goTo = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % courses.length);
  }, [courses.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + courses.length) % courses.length);
  }, [courses.length]);

  // Auto-rotation timer
  useEffect(() => {
    if (isPaused || courses.length <= 1) return;
    timerRef.current = setInterval(goNext, ROTATION_INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, goNext, courses.length]);

  // Play video when slide changes
  useEffect(() => {
    if (videoRef.current && hasVideo) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }, [currentIndex, hasVideo]);

  if (!course) return null;

  return (
    <section
      className="relative h-[50vh] min-h-[400px] max-h-[600px] -mx-4 md:-mx-6 lg:-mx-8 -mt-4 md:-mt-6 lg:-mt-8 overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background - Video or Image */}
      <AnimatePresence mode="wait">
        <motion.div
          key={course.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          {hasVideo ? (
            <video
              ref={videoRef}
              src={course.videoUrl}
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : course.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-brand-700 via-brand-900 to-surface-dark" />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-surface-dark via-surface-dark/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-surface-dark/80 via-transparent to-transparent" />

      {/* Navigation arrows */}
      {courses.length > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20
                       w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm
                       flex items-center justify-center
                       opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity
                       text-white/80 hover:text-white hover:bg-black/60"
            aria-label="Curso anterior"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20
                       w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm
                       flex items-center justify-center
                       opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity
                       text-white/80 hover:text-white hover:bg-black/60"
            aria-label="Próximo curso"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 lg:p-12 z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={course.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="max-w-2xl"
          >
            {course.isRequired && (
              <span className="inline-block px-2.5 py-1 bg-red-500/90 backdrop-blur-sm rounded-md text-xs font-semibold text-white mb-3">
                Obrigatório
              </span>
            )}

            <h1 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl text-white tracking-tight leading-tight">
              {course.title}
            </h1>

            <p className="mt-3 text-sm md:text-base text-white/70 font-body line-clamp-3 max-w-xl">
              {course.description}
            </p>

            <div className="flex items-center gap-3 mt-5">
              <Link
                href={`/courses/${course.id}`}
                className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-lg font-display font-semibold text-sm hover:bg-white/90 transition-colors active:scale-[0.98]"
              >
                <Play className="w-5 h-5" />
                Assistir
              </Link>
              <Link
                href={`/courses/${course.id}`}
                className="flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-lg font-display font-medium text-sm hover:bg-white/30 transition-colors active:scale-[0.98]"
              >
                <Info className="w-5 h-5" />
                Mais Informações
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Dot indicators */}
        {courses.length > 1 && (
          <div className="flex items-center gap-2 mt-5">
            {courses.map((c, i) => (
              <button
                key={c.id}
                onClick={() => goTo(i)}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === currentIndex
                    ? 'w-8 bg-white'
                    : 'w-4 bg-white/40 hover:bg-white/60'
                }`}
                aria-label={`Ir para ${c.title}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function HeroBannerSkeleton() {
  return (
    <div className="relative h-[50vh] min-h-[400px] max-h-[600px] -mx-4 md:-mx-6 lg:-mx-8 -mt-4 md:-mt-6 lg:-mt-8 skeleton-shimmer rounded-none" />
  );
}
