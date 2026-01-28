'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Play } from 'lucide-react';
import { formatDuration, formatPlayerTime } from '@motochefe/shared/utils';

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
    <section>
      <h2 className="text-2xl font-bold mb-4">Continue Assistindo</h2>
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">
        {items.map((item) => (
          <Link
            key={item.lessonId}
            href={`/player/${item.lessonId}`}
            className="flex-shrink-0 w-80"
          >
            <div className="group relative bg-surface-card rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-brand-500 transition-all">
              {/* Thumbnail */}
              <div className="relative aspect-video">
                {item.thumbnailUrl ? (
                  <Image
                    src={item.thumbnailUrl}
                    alt={item.lessonTitle}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800" />
                )}

                {/* Play overlay */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="w-7 h-7 text-black ml-1" />
                  </div>
                </div>

                {/* Time remaining */}
                {item.duration > 0 && (
                  <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 rounded text-xs">
                    {formatPlayerTime(Math.max(0, item.duration - item.lastPosition))} restantes
                  </div>
                )}

                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
                  <div
                    className="h-full bg-brand-500"
                    style={{ width: `${item.percentComplete}%` }}
                  />
                </div>
              </div>

              {/* Content */}
              <div className="p-3">
                <p className="text-sm text-gray-400 line-clamp-1">{item.courseTitle}</p>
                <h4 className="font-medium text-white line-clamp-1">{item.lessonTitle}</h4>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
