'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Play, Clock, CheckCircle } from 'lucide-react';
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

  return (
    <Link href={`/courses/${course.id}`}>
      <div className="course-card group relative bg-surface-card rounded-lg overflow-hidden cursor-pointer">
        {/* Thumbnail */}
        <div className="relative aspect-video">
          {course.thumbnailUrl ? (
            <Image
              src={course.thumbnailUrl}
              alt={course.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-brand-600 to-brand-800" />
          )}

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-brand-500 flex items-center justify-center">
              <Play className="w-8 h-8 text-white ml-1" />
            </div>
          </div>

          {/* Badges */}
          {showBadge === 'required' && !isCompleted && (
            <div className="absolute top-2 left-2 px-2 py-1 bg-red-500 rounded text-xs font-semibold">
              Obrigatório
            </div>
          )}
          {isCompleted && (
            <div className="absolute top-2 right-2">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
          )}

          {/* Progress bar */}
          {course.progress !== undefined && course.progress > 0 && !isCompleted && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
              <div
                className="h-full bg-brand-500"
                style={{ width: `${course.progress}%` }}
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-white line-clamp-1 group-hover:text-brand-400 transition-colors">
            {course.title}
          </h3>
          <p className="mt-1 text-sm text-gray-400 line-clamp-2">
            {course.description}
          </p>
          <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(course.durationMinutes * 60)}
            </span>
            <span>{course.lessonsCount} aulas</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
