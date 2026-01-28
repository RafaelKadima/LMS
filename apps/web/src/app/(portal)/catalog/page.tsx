'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { CourseCard } from '@/components/catalog/CourseCard';
import { ContinueWatching } from '@/components/catalog/ContinueWatching';

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

  return (
    <div className="space-y-8">
      {/* Continue Watching */}
      {continueWatching && continueWatching.length > 0 && (
        <ContinueWatching items={continueWatching} />
      )}

      {/* Required Courses */}
      {required && required.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-4">Cursos Obrigatórios</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {required.map((course: any) => (
              <CourseCard key={course.id} course={course} showBadge="required" />
            ))}
          </div>
        </section>
      )}

      {/* All Courses */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Todos os Cursos</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-surface-card rounded-lg h-64 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {catalog?.data?.map((course: any) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
