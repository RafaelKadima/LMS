'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Link from 'next/link';
import { ArrowLeft, BookOpen, CheckCircle, Play, Lock } from 'lucide-react';

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
    <div className="flex items-center gap-4 p-4 glass rounded-xl border border-white/[0.06] hover:border-white/[0.12] transition-colors">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isCompleted ? 'bg-green-500/15 text-green-500'
            : inProgress ? 'bg-brand-500/15 text-brand-500'
            : 'bg-white/[0.06] text-white/40'
        }`}
      >
        {isCompleted ? <CheckCircle className="w-5 h-5" /> : <span className="font-display font-medium">{index + 1}</span>}
      </div>

      <div className="w-20 h-12 rounded-lg overflow-hidden bg-white/[0.04] flex-shrink-0 hidden sm:block">
        {course.thumbnailUrl ? (
          <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white/20" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-white truncate font-body">{course.title}</h3>
        <div className="flex items-center gap-3 mt-1 text-sm text-white/40 font-body">
          <span>{course.lessonsCount} aulas</span>
          {course.durationMinutes > 0 && <span>{course.durationMinutes} min</span>}
        </div>
        {inProgress && (
          <div className="mt-2 w-full max-w-xs">
            <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full" style={{ width: `${course.progress}%` }} />
            </div>
          </div>
        )}
      </div>

      {isEnrolled ? (
        <Link
          href={`/courses/${course.id}`}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors shrink-0 ${
            isCompleted ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
              : inProgress ? 'bg-brand-500 text-white hover:bg-brand-600 shadow-glow'
              : 'bg-white/[0.06] text-white/60 hover:bg-white/[0.08]'
          }`}
        >
          {isCompleted ? <><CheckCircle className="w-4 h-4" /><span className="hidden sm:inline">Concluído</span></> :
           inProgress ? <><Play className="w-4 h-4" /><span className="hidden sm:inline">Continuar</span></> :
           <><Play className="w-4 h-4" /><span className="hidden sm:inline">Iniciar</span></>}
        </Link>
      ) : (
        <div className="flex items-center gap-2 px-4 py-2 text-white/30 text-sm">
          <Lock className="w-4 h-4" />
          <span className="hidden sm:inline">Bloqueado</span>
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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['track', trackId] }); },
  });

  const isEnrolled = track?.courses?.some((c: Course) => c.progress > 0 || c.completed);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-surface-card rounded-xl w-48 skeleton-shimmer" />
        <div className="h-48 bg-surface-card rounded-2xl skeleton-shimmer" />
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (<div key={i} className="h-24 bg-surface-card rounded-xl skeleton-shimmer" />))}
        </div>
      </div>
    );
  }

  if (!track) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-display font-semibold text-white/60">Trilha não encontrada</h2>
        <Link href="/tracks" className="text-brand-500 hover:underline mt-2 inline-block font-body">Voltar para trilhas</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors font-body text-sm">
        <ArrowLeft className="w-5 h-5" /> Voltar
      </button>

      <div className="glass rounded-2xl p-6 border border-white/[0.06]">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-64 aspect-video rounded-xl overflow-hidden bg-white/[0.04] flex-shrink-0">
            {track.thumbnailUrl ? (
              <img src={track.thumbnailUrl} alt={track.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-12 h-12 text-white/20" /></div>
            )}
          </div>

          <div className="flex-1">
            {track.isRequired && (
              <span className="inline-block bg-red-500/90 text-white text-xs px-2.5 py-1 rounded-lg mb-2 font-medium">Trilha Obrigatória</span>
            )}
            <h1 className="text-2xl font-display font-bold text-white tracking-tight">{track.title}</h1>
            {track.description && <p className="mt-3 text-white/50 font-body">{track.description}</p>}

            <div className="mt-4 flex items-center gap-6 text-sm text-white/40 font-body">
              <div className="flex items-center gap-2"><BookOpen className="w-4 h-4" /><span>{track.totalCourses} cursos</span></div>
              <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /><span>{track.completedCourses} concluídos</span></div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2 font-body">
                <span className="text-white/40">Progresso geral</span>
                <span className="text-white font-medium">{track.overallProgress}%</span>
              </div>
              <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all" style={{ width: `${track.overallProgress}%` }} />
              </div>
            </div>

            {!isEnrolled && (
              <button
                onClick={() => enrollMutation.mutate()}
                disabled={enrollMutation.isPending}
                className="mt-4 px-6 py-2.5 bg-brand-500 text-white rounded-xl font-medium hover:bg-brand-600 disabled:opacity-50 transition-colors shadow-glow active:scale-[0.98]"
              >
                {enrollMutation.isPending ? 'Inscrevendo...' : 'Inscrever-se na Trilha'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-display font-semibold mb-4">Cursos da Trilha</h2>
        <div className="space-y-3">
          {track.courses.map((course: Course, index: number) => (
            <CourseItem key={course.id} course={course} index={index} isEnrolled={isEnrolled || track.overallProgress > 0} />
          ))}
        </div>
      </div>
    </div>
  );
}
