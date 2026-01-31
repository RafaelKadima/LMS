'use client';

import Link from 'next/link';
import { Play } from 'lucide-react';
import { formatPlayerTime } from '@motochefe/shared/utils';
import { CourseRow } from './CourseRow';

interface ContinueWatchingItem {
  lessonId: string;
  lessonTitle: string;
  courseId: string;
  courseTitle: string;
  thumbnailUrl?: string;
  lastPosition: number;
  duration: number;
  percentComplete: number;
  updatedAt: string;
}

interface ContinueWatchingProps {
  items: ContinueWatchingItem[];
}

export function ContinueWatching({ items }: ContinueWatchingProps) {
  if (items.length === 0) return null;

  return (
    <CourseRow title="Continue Assistindo">
      {items.map((item) => (
        <Link
          key={item.lessonId}
          href={`/player/${item.lessonId}`}
          className="flex-shrink-0 w-[240px] sm:w-[280px] md:w-[320px] snap-start"
        >
          <div className="group relative transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.08] hover:z-20">
            <div className="relative bg-surface-card rounded-lg overflow-hidden border border-white/[0.06] group-hover:border-white/[0.12] group-hover:shadow-elevated transition-all duration-300">
              {/* Thumbnail */}
              <div className="relative aspect-video">
                {item.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.thumbnailUrl}
                    alt={item.lessonTitle}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-white/[0.06] to-white/[0.02]" />
                )}

                {/* Play overlay */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="w-11 h-11 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-elevated">
                    <Play className="w-5 h-5 text-black ml-0.5" />
                  </div>
                </div>

                {/* Time remaining */}
                {item.duration > 0 && (
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 backdrop-blur-sm rounded text-[10px] font-body text-white/80">
                    {formatPlayerTime(Math.max(0, item.duration - item.lastPosition))} restantes
                  </div>
                )}

                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/[0.06]">
                  <div
                    className="h-full bg-gradient-to-r from-brand-500 to-brand-400"
                    style={{ width: `${item.percentComplete}%` }}
                  />
                </div>
              </div>

              {/* Content */}
              <div className="p-3">
                <p className="text-[11px] text-white/40 line-clamp-1 font-body">{item.courseTitle}</p>
                <h4 className="font-display font-medium text-sm text-white line-clamp-1">{item.lessonTitle}</h4>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </CourseRow>
  );
}
