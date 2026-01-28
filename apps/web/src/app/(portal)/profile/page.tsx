'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
  BookOpen,
  Clock,
  CheckCircle,
  Play,
  Trophy,
  Target,
  TrendingUp,
} from 'lucide-react';

interface CourseProgress {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  durationMinutes: number;
  lessonsCount: number;
  progress: number;
  status: 'active' | 'completed' | 'expired' | 'cancelled' | null;
  isRequired: boolean;
}

function ProgressCard({ course }: { course: CourseProgress }) {
  const isCompleted = course.status === 'completed';
  const inProgress = course.progress > 0 && !isCompleted;

  return (
    <div className="bg-surface-card rounded-xl overflow-hidden border border-gray-800">
      <div className="flex">
        {/* Thumbnail */}
        <div className="w-32 h-24 flex-shrink-0 bg-surface-hover">
          {course.thumbnailUrl ? (
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-gray-600" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-white truncate">{course.title}</h3>
                {course.isRequired && (
                  <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">
                    Obrigatório
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                <span>{course.lessonsCount} aulas</span>
                {course.durationMinutes > 0 && <span>{course.durationMinutes} min</span>}
              </div>
            </div>

            {/* Status badge */}
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                isCompleted
                  ? 'bg-green-500/20 text-green-400'
                  : inProgress
                    ? 'bg-brand-500/20 text-brand-400'
                    : 'bg-gray-700 text-gray-400'
              }`}
            >
              {isCompleted ? (
                <>
                  <CheckCircle className="w-3 h-3" />
                  Concluído
                </>
              ) : inProgress ? (
                <>
                  <Play className="w-3 h-3" />
                  Em progresso
                </>
              ) : (
                <>
                  <Clock className="w-3 h-3" />
                  Não iniciado
                </>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-500">Progresso</span>
              <span className="text-white">{course.progress}%</span>
            </div>
            <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isCompleted ? 'bg-green-500' : 'bg-brand-500'
                }`}
                style={{ width: `${course.progress}%` }}
              />
            </div>
          </div>

          {/* Action */}
          <div className="mt-3">
            <Link
              href={`/courses/${course.id}`}
              className="text-sm text-brand-500 hover:text-brand-400 font-medium"
            >
              {isCompleted ? 'Revisar curso' : inProgress ? 'Continuar' : 'Começar'} →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { data: catalog, isLoading: loadingCatalog } = useQuery({
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

  // Filter enrolled courses (those with progress > 0 or enrolled status)
  const enrolledCourses = catalog?.data?.filter(
    (c: CourseProgress) => c.progress > 0 || c.status
  ) || [];

  const completedCourses = enrolledCourses.filter(
    (c: CourseProgress) => c.status === 'completed'
  );
  const inProgressCourses = enrolledCourses.filter(
    (c: CourseProgress) => c.progress > 0 && c.status !== 'completed'
  );

  // Stats
  const totalCompleted = completedCourses.length;
  const totalInProgress = inProgressCourses.length;
  const totalLessonsWatched = continueWatching?.length || 0;

  // Required courses progress
  const requiredCompleted = required?.filter((c: any) => c.completed)?.length || 0;
  const requiredTotal = required?.length || 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Meu Progresso</h1>
        <p className="mt-2 text-gray-400">
          Acompanhe seu progresso de aprendizado
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-card rounded-xl p-4 border border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{totalCompleted}</p>
              <p className="text-sm text-gray-500">Cursos concluídos</p>
            </div>
          </div>
        </div>

        <div className="bg-surface-card rounded-xl p-4 border border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-brand-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{totalInProgress}</p>
              <p className="text-sm text-gray-500">Em andamento</p>
            </div>
          </div>
        </div>

        <div className="bg-surface-card rounded-xl p-4 border border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{totalLessonsWatched}</p>
              <p className="text-sm text-gray-500">Aulas assistindo</p>
            </div>
          </div>
        </div>

        <div className="bg-surface-card rounded-xl p-4 border border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {requiredCompleted}/{requiredTotal}
              </p>
              <p className="text-sm text-gray-500">Obrigatórios</p>
            </div>
          </div>
        </div>
      </div>

      {/* Required courses section */}
      {required && required.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-red-500" />
            Cursos Obrigatórios
          </h2>
          <div className="space-y-3">
            {required.map((course: any) => (
              <ProgressCard
                key={course.id}
                course={{
                  ...course,
                  status: course.completed ? 'completed' : course.progress > 0 ? 'active' : null,
                  isRequired: true,
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* In progress section */}
      {inProgressCourses.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-500" />
            Em Andamento
          </h2>
          <div className="space-y-3">
            {inProgressCourses.map((course: CourseProgress) => (
              <ProgressCard key={course.id} course={course} />
            ))}
          </div>
        </section>
      )}

      {/* Completed section */}
      {completedCourses.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Concluídos
          </h2>
          <div className="space-y-3">
            {completedCourses.map((course: CourseProgress) => (
              <ProgressCard key={course.id} course={course} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {enrolledCourses.length === 0 && !loadingCatalog && (
        <div className="text-center py-12 bg-surface-card rounded-xl">
          <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300">Nenhum curso iniciado</h3>
          <p className="text-gray-500 mt-1 mb-4">
            Comece a aprender explorando nosso catálogo de cursos
          </p>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
          >
            Explorar catálogo
          </Link>
        </div>
      )}
    </div>
  );
}
