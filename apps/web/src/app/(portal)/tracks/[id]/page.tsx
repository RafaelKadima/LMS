'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  CheckCircle,
  Play,
  Lock,
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  thumbnailUrl?: string;
  durationMinutes: number;
  lessonsCount: number;
  progress: number;
  completed: boolean;
}

interface Track {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  isRequired: boolean;
  overallProgress: number;
  completedCourses: number;
  totalCourses: number;
  courses: Course[];
}

function CourseItem({ course, index, isEnrolled }: { course: Course; index: number; isEnrolled: boolean }) {
  const isCompleted = course.completed;
  const inProgress = course.progress > 0 && !isCompleted;

  return (
    <div className="flex items-center gap-4 p-4 bg-surface-card rounded-lg border border-gray-800 hover:border-gray-700 transition-colors">
      {/* Order number / Status */}
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
          isCompleted
            ? 'bg-green-500/20 text-green-500'
            : inProgress
              ? 'bg-brand-500/20 text-brand-500'
              : 'bg-gray-700 text-gray-400'
        }`}
      >
        {isCompleted ? (
          <CheckCircle className="w-5 h-5" />
        ) : (
          <span className="font-medium">{index + 1}</span>
        )}
      </div>

      {/* Thumbnail */}
      <div className="w-20 h-12 rounded overflow-hidden bg-surface-hover flex-shrink-0">
        {course.thumbnailUrl ? (
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-gray-600" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-white truncate">{course.title}</h3>
        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
          <span>{course.lessonsCount} aulas</span>
          {course.durationMinutes > 0 && <span>{course.durationMinutes} min</span>}
        </div>
        {inProgress && (
          <div className="mt-2 w-full max-w-xs">
            <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full"
                style={{ width: `${course.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Action */}
      {isEnrolled ? (
        <Link
          href={`/courses/${course.id}`}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isCompleted
              ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
              : inProgress
                ? 'bg-brand-500 text-white hover:bg-brand-600'
                : 'bg-surface-hover text-gray-300 hover:bg-gray-700'
          }`}
        >
          {isCompleted ? (
            <>
              <CheckCircle className="w-4 h-4" />
              Concluído
            </>
          ) : inProgress ? (
            <>
              <Play className="w-4 h-4" />
              Continuar
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Iniciar
            </>
          )}
        </Link>
      ) : (
        <div className="flex items-center gap-2 px-4 py-2 text-gray-500 text-sm">
          <Lock className="w-4 h-4" />
          Bloqueado
        </div>
      )}
    </div>
  );
}

export default function TrackDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const trackId = params.id as string;

  const { data: track, isLoading } = useQuery({
    queryKey: ['track', trackId],
    queryFn: () => api.getTrack(trackId),
  });

  const enrollMutation = useMutation({
    mutationFn: () => api.enrollInTrack(trackId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['track', trackId] });
    },
  });

  const isEnrolled = track?.courses?.some((c: Course) => c.progress > 0 || c.completed);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-surface-card rounded w-48" />
        <div className="h-48 bg-surface-card rounded-xl" />
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-surface-card rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!track) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-300">Trilha não encontrada</h2>
        <Link href="/tracks" className="text-brand-500 hover:underline mt-2 inline-block">
          Voltar para trilhas
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Voltar
      </button>

      {/* Header */}
      <div className="bg-surface-card rounded-xl p-6 border border-gray-800">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Thumbnail */}
          <div className="w-full md:w-64 aspect-video rounded-lg overflow-hidden bg-surface-hover flex-shrink-0">
            {track.thumbnailUrl ? (
              <img
                src={track.thumbnailUrl}
                alt={track.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen className="w-12 h-12 text-gray-600" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                {track.isRequired && (
                  <span className="inline-block bg-red-500 text-white text-xs px-2 py-1 rounded mb-2">
                    Trilha Obrigatória
                  </span>
                )}
                <h1 className="text-2xl font-bold text-white">{track.title}</h1>
              </div>
            </div>

            {track.description && (
              <p className="mt-3 text-gray-400">{track.description}</p>
            )}

            {/* Stats */}
            <div className="mt-4 flex items-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                <span>{track.totalCourses} cursos</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>{track.completedCourses} concluídos</span>
              </div>
            </div>

            {/* Progress */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-400">Progresso geral</span>
                <span className="text-white font-medium">{track.overallProgress}%</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-500 rounded-full transition-all"
                  style={{ width: `${track.overallProgress}%` }}
                />
              </div>
            </div>

            {/* Enroll button */}
            {!isEnrolled && (
              <button
                onClick={() => enrollMutation.mutate()}
                disabled={enrollMutation.isPending}
                className="mt-4 px-6 py-2.5 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 disabled:opacity-50 transition-colors"
              >
                {enrollMutation.isPending ? 'Inscrevendo...' : 'Inscrever-se na Trilha'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Courses list */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Cursos da Trilha</h2>
        <div className="space-y-3">
          {track.courses.map((course: Course, index: number) => (
            <CourseItem
              key={course.id}
              course={course}
              index={index}
              isEnrolled={isEnrolled || track.overallProgress > 0}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
