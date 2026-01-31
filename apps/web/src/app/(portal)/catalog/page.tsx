'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { CourseCard } from '@/components/catalog/CourseCard';
import { ContinueWatching } from '@/components/catalog/ContinueWatching';
import { CourseRow } from '@/components/catalog/CourseRow';
import { HeroBanner, HeroBannerSkeleton } from '@/components/catalog/HeroBanner';

export default function CatalogPage() {
  const { data: catalog, isLoading } = useQuery({
    queryKey: ['catalog'],
    queryFn: () => api.getCatalog({}),
  });

  const { data: continueWatching } = useQuery({
    queryKey: ['continue-watching'],
    queryFn: () => api.getContinueWatching(),
  });

  const { data: required } = useQuery({
    queryKey: ['required'],
    queryFn: () => api.getRequired(),
  });

  // Select hero courses for carousel: prioritize courses with video thumbnails
  const heroCourses = useMemo(() => {
    const all: any[] = [];
    const seen = new Set<string>();

    // First: incomplete required courses
    if (required) {
      for (const c of required) {
        if (c.status !== 'completed' && !seen.has(c.id)) {
          seen.add(c.id);
          all.push({ ...c, isRequired: true });
        }
      }
    }

    // Then: catalog courses
    if (catalog?.data) {
      for (const c of catalog.data) {
        if (!seen.has(c.id)) {
          seen.add(c.id);
          all.push(c);
        }
      }
    }

    // Prioritize courses with video, limit to 6
    const withVideo = all.filter((c) => !!c.videoUrl);
    const withoutVideo = all.filter((c) => !c.videoUrl);
    return [...withVideo, ...withoutVideo].slice(0, 6);
  }, [required, catalog]);

  return (
    <div className="-mx-4 md:-mx-6 lg:-mx-8">
      {/* Hero Banner */}
      {isLoading ? (
        <HeroBannerSkeleton />
      ) : heroCourses.length > 0 ? (
        <HeroBanner courses={heroCourses} />
      ) : null}

      {/* Content Rows */}
      <div className="px-4 md:px-6 lg:px-8 space-y-6 mt-6">
        {/* Continue Watching */}
        {continueWatching && continueWatching.length > 0 && (
          <ContinueWatching items={continueWatching} />
        )}

        {/* Required Courses */}
        {required && required.length > 0 && (
          <CourseRow title="Cursos Obrigatórios">
            {required.map((course: any) => (
              <CourseCard key={course.id} course={course} showBadge="required" />
            ))}
          </CourseRow>
        )}

        {/* All Courses */}
        {isLoading ? (
          <CourseRow title="Todos os Cursos">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-[200px] sm:w-[240px] md:w-[280px] snap-start"
              >
                <div className="aspect-video rounded-lg skeleton-shimmer" />
                <div className="mt-2 h-4 w-3/4 rounded skeleton-shimmer" />
              </div>
            ))}
          </CourseRow>
        ) : (
          <CourseRow title="Todos os Cursos">
            {catalog?.data?.map((course: any) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </CourseRow>
        )}
      </div>
    </div>
  );
}
