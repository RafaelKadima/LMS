'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { Play, Clock, CheckCircle, Info } from 'lucide-react';
import { formatDuration } from '@motochefe/shared/utils';

interface CourseCardProps {
  course: {
    id: string;
    title: string;
    description: string;
    thumbnailUrl?: string;
    durationMinutes: number;
    lessonsCount: number;
    progress?: number;
    isRequired?: boolean;
    status?: string;
  };
  showBadge?: 'required' | 'completed' | null;
}

export function CourseCard({ course, showBadge }: CourseCardProps) {
  const isCompleted = course.status === 'completed';
  const isVideo = course.thumbnailUrl?.endsWith('.mp4');
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMouseEnter = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 1;
    }
  };

  return (
    <Link
      href={`/courses/${course.id}`}
      className="flex-shrink-0 w-[200px] sm:w-[240px] md:w-[280px] snap-start"
    >
      <div
        className="group relative transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.08] hover:z-20 first:origin-left last:origin-right"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="relative bg-surface-card rounded-lg overflow-visible border border-white/[0.06] group-hover:border-white/[0.12] group-hover:shadow-elevated transition-all duration-300">
          {/* Thumbnail */}
          <div className="relative aspect-video rounded-lg overflow-hidden">
            {isVideo ? (
              <video
                ref={videoRef}
                src={course.thumbnailUrl}
                muted
                autoPlay
                playsInline
                loop
                preload="metadata"
                className="w-full h-full object-cover"
              />
            ) : course.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={course.thumbnailUrl}
                alt={course.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-brand-600 to-brand-800" />
            )}

            {/* Badges */}
            {showBadge === 'required' && !isCompleted && (
              <div className="absolute top-2 left-2 px-2 py-0.5 bg-red-500/90 backdrop-blur-sm rounded-md text-[10px] font-semibold text-white">
                Obrigatório
              </div>
            )}
            {isCompleted && (
              <div className="absolute top-2 right-2">
                <CheckCircle className="w-5 h-5 text-green-500 drop-shadow-lg" />
              </div>
            )}

            {/* Progress bar */}
            {course.progress !== undefined && course.progress > 0 && !isCompleted && (
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/[0.06]">
                <div
                  className="h-full bg-gradient-to-r from-brand-500 to-brand-400"
                  style={{ width: `${course.progress}%` }}
                />
              </div>
            )}
          </div>

          {/* Title - always visible */}
          <div className="p-3 pb-2">
            <h3 className="font-display font-semibold text-sm text-white line-clamp-1 group-hover:text-brand-400 transition-colors">
              {course.title}
            </h3>
          </div>

          {/* Hover-expanded info */}
          <div className="max-h-0 opacity-0 group-hover:max-h-44 group-hover:opacity-100 transition-all duration-300 overflow-hidden px-3 pb-0 group-hover:pb-3">
            <p className="text-[11px] text-white/50 line-clamp-2 font-body leading-relaxed">
              {course.description}
            </p>

            <div className="flex items-center gap-3 mt-2 text-[11px] text-white/40 font-body">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDuration(course.durationMinutes * 60)}
              </span>
              <span>{course.lessonsCount} aulas</span>
            </div>

            {/* Netflix-style action buttons */}
            <div className="flex items-center gap-2 mt-3">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-white/90 transition-colors">
                <Play className="w-4 h-4 text-black ml-0.5" />
              </div>
              <div className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center hover:border-white transition-colors">
                <Info className="w-4 h-4 text-white" />
              </div>
              {isCompleted && (
                <span className="ml-auto text-[10px] text-green-500 font-medium">Concluído</span>
              )}
              {course.progress !== undefined && course.progress > 0 && !isCompleted && (
                <span className="ml-auto text-[10px] text-brand-400 font-medium">{course.progress}%</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
