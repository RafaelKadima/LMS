'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Play, Clock, CheckCircle, Lock } from 'lucide-react';
import { formatDuration } from '@motochefe/shared/utils';
import Image from 'next/image';

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const courseId = params.id as string;

  const { data: course, isLoading, refetch } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => api.getCourse(courseId),
  });

  const enrollMutation = useMutation({
    mutationFn: () => api.enrollInCourse(courseId),
    onSuccess: () => {
      // Refetch course to update enrollment status
      refetch();
      // Invalidate catalog queries to update the catalog/profile pages
      queryClient.invalidateQueries({ queryKey: ['catalog'] });
      queryClient.invalidateQueries({ queryKey: ['required'] });
      queryClient.invalidateQueries({ queryKey: ['continue-watching'] });
    },
    onError: (error: any) => {
      console.error('Erro ao matricular:', error);
      alert(error.response?.data?.message || 'Erro ao iniciar curso. Tente novamente.');
    },
  });

  const handleStartLesson = (lessonId: string) => {
    router.push(`/player/${lessonId}`);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="h-64 bg-surface-card rounded-lg" />
        <div className="h-8 bg-surface-card rounded w-1/3" />
        <div className="h-4 bg-surface-card rounded w-2/3" />
      </div>
    );
  }

  if (!course) {
    return <div>Curso não encontrado</div>;
  }

  const totalLessons = course.modules.reduce(
    (acc: number, m: any) => acc + m.lessons.length,
    0
  );
  const completedLessons = course.modules.reduce(
    (acc: number, m: any) =>
      acc + m.lessons.filter((l: any) => l.progress?.completedAt).length,
    0
  );
  const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Hero */}
      <div className="relative h-72 rounded-xl overflow-hidden">
        {course.thumbnailUrl ? (
          <Image
            src={course.thumbnailUrl}
            alt={course.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-brand-600 to-brand-800" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h1 className="text-3xl font-bold text-white">{course.title}</h1>
          <div className="flex items-center gap-4 mt-2 text-gray-300">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatDuration(course.durationMinutes * 60)}
            </span>
            <span>{totalLessons} aulas</span>
            {progress > 0 && (
              <span className="text-brand-400">{progress}% concluído</span>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-300 text-lg">{course.description}</p>

      {/* Enroll button if not enrolled */}
      {!course.enrollment && (
        <button
          onClick={() => enrollMutation.mutate()}
          disabled={enrollMutation.isPending}
          className="w-full py-4 bg-brand-500 hover:bg-brand-600 rounded-lg text-lg font-semibold transition-colors disabled:opacity-50"
        >
          {enrollMutation.isPending ? 'Inscrevendo...' : 'Iniciar Curso'}
        </button>
      )}

      {/* Progress bar */}
      {course.enrollment && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progresso</span>
            <span>{progress}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Modules and Lessons */}
      <div className="space-y-6">
        {course.modules.map((module: any, moduleIndex: number) => (
          <div key={module.id} className="bg-surface-card rounded-lg overflow-hidden">
            <div className="p-4 bg-surface-hover">
              <h3 className="text-lg font-semibold">
                Módulo {moduleIndex + 1}: {module.title}
              </h3>
              {module.description && (
                <p className="text-gray-400 text-sm mt-1">{module.description}</p>
              )}
            </div>
            <div className="divide-y divide-gray-700">
              {module.lessons.map((lesson: any, lessonIndex: number) => {
                const isCompleted = lesson.progress?.completedAt;
                const isLocked = false; // Could implement sequential unlock

                return (
                  <button
                    key={lesson.id}
                    onClick={() => !isLocked && handleStartLesson(lesson.id)}
                    disabled={isLocked}
                    className="w-full p-4 flex items-center gap-4 hover:bg-surface-hover transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="w-10 h-10 rounded-full bg-surface-dark flex items-center justify-center">
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : isLocked ? (
                        <Lock className="w-5 h-5 text-gray-500" />
                      ) : (
                        <Play className="w-5 h-5 text-brand-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">
                        {lessonIndex + 1}. {lesson.title}
                      </h4>
                      {lesson.description && (
                        <p className="text-sm text-gray-400 line-clamp-1">
                          {lesson.description}
                        </p>
                      )}
                    </div>
                    <div className="text-sm text-gray-400">
                      {formatDuration(lesson.durationSeconds)}
                    </div>
                    {lesson.progress && !isCompleted && (
                      <div className="text-sm text-brand-400">
                        {lesson.progress.percentComplete}%
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
