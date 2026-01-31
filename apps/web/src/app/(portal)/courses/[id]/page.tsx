'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Play, Clock, CheckCircle, Lock, BookOpen, ArrowLeft, Trophy } from 'lucide-react';
import { formatDuration } from '@motochefe/shared/utils';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

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
      refetch();
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
      <div className="-mx-4 md:-mx-6 lg:-mx-8 -mt-4 md:-mt-6 lg:-mt-8">
        <div className="h-[40vh] min-h-[320px] max-h-[480px] skeleton-shimmer" />
        <div className="px-4 md:px-6 lg:px-8 mt-8 max-w-5xl mx-auto space-y-6">
          <div className="h-8 bg-surface-card rounded-xl w-2/3 skeleton-shimmer" />
          <div className="h-4 bg-surface-card rounded-xl w-full skeleton-shimmer" />
          <div className="h-4 bg-surface-card rounded-xl w-1/2 skeleton-shimmer" />
          <div className="space-y-4 mt-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-surface-card rounded-xl skeleton-shimmer" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-20">
        <BookOpen className="w-12 h-12 text-white/20 mx-auto mb-4" />
        <p className="text-white/50 font-body text-lg">Curso não encontrado</p>
        <Link href="/catalog" className="text-brand-500 hover:underline mt-2 inline-block font-body">
          Voltar ao catálogo
        </Link>
      </div>
    );
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
  const isCompleted = progress === 100;

  // Thumbnail: usar thumb do curso, ou fallback para primeiro vídeo da aula
  const firstLesson = course.modules?.flatMap((m: any) => m.lessons)[0];
  const courseThumbnail = course.thumbnailUrl || firstLesson?.thumbnailUrl || firstLesson?.videoUrl || null;

  // Find the next uncompleted lesson for the "Continue" button
  let nextLesson: any = null;
  for (const mod of course.modules) {
    for (const lesson of mod.lessons) {
      if (!lesson.progress?.completedAt) {
        nextLesson = lesson;
        break;
      }
    }
    if (nextLesson) break;
  }

  return (
    <div className="-mx-4 md:-mx-6 lg:-mx-8 -mt-4 md:-mt-6 lg:-mt-8">
      {/* Hero Section - Netflix Style */}
      <section className="relative h-[40vh] min-h-[320px] max-h-[480px]">
        {courseThumbnail && courseThumbnail.endsWith('.mp4') ? (
          <video
            src={courseThumbnail}
            muted
            playsInline
            preload="metadata"
            className="absolute inset-0 w-full h-full object-cover"
            onLoadedData={(e) => { e.currentTarget.currentTime = 1; }}
          />
        ) : courseThumbnail ? (
          <Image
            src={courseThumbnail}
            alt={course.title}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brand-700 via-brand-900 to-surface-dark" />
        )}

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-dark via-surface-dark/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-surface-dark/70 via-transparent to-transparent" />

        {/* Back button */}
        <div className="absolute top-4 left-4 md:top-6 md:left-6 lg:top-8 lg:left-8 z-10">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/40 backdrop-blur-sm text-white/80 hover:text-white hover:bg-black/60 transition-all text-sm font-body"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Voltar</span>
          </button>
        </div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="absolute bottom-0 left-0 right-0 p-4 md:p-6 lg:p-8"
        >
          <div className="max-w-5xl mx-auto">
            {isCompleted && (
              <div className="flex items-center gap-2 text-green-400 mb-2">
                <Trophy className="w-4 h-4" />
                <span className="text-sm font-medium font-body">Curso concluído</span>
              </div>
            )}

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white tracking-tight leading-tight">
              {course.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 mt-3 text-white/60 font-body text-sm">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {formatDuration(course.durationMinutes * 60)}
              </span>
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" />
                {totalLessons} aulas
              </span>
              <span className="flex items-center gap-1.5">
                {course.modules.length} módulos
              </span>
              {progress > 0 && !isCompleted && (
                <span className="text-brand-400 font-medium">{progress}% concluído</span>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 mt-5">
              {!course.enrollment ? (
                <button
                  onClick={() => enrollMutation.mutate()}
                  disabled={enrollMutation.isPending}
                  className="flex items-center gap-2 px-7 py-3 bg-white text-black rounded-lg font-display font-semibold text-sm hover:bg-white/90 transition-colors active:scale-[0.98] disabled:opacity-50"
                >
                  <Play className="w-5 h-5" />
                  {enrollMutation.isPending ? 'Inscrevendo...' : 'Iniciar Curso'}
                </button>
              ) : nextLesson ? (
                <button
                  onClick={() => handleStartLesson(nextLesson.id)}
                  className="flex items-center gap-2 px-7 py-3 bg-white text-black rounded-lg font-display font-semibold text-sm hover:bg-white/90 transition-colors active:scale-[0.98]"
                >
                  <Play className="w-5 h-5" />
                  {completedLessons > 0 ? 'Continuar' : 'Assistir'}
                </button>
              ) : (
                <button
                  onClick={() => handleStartLesson(course.modules[0]?.lessons[0]?.id)}
                  className="flex items-center gap-2 px-7 py-3 bg-white/20 backdrop-blur-sm text-white rounded-lg font-display font-medium text-sm hover:bg-white/30 transition-colors active:scale-[0.98]"
                >
                  <Play className="w-5 h-5" />
                  Reassistir
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Content */}
      <div className="px-4 md:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-8 mt-8">
          {/* Description */}
          {course.description && (
            <p className="text-white/50 text-base md:text-lg font-body leading-relaxed max-w-3xl">
              {course.description}
            </p>
          )}

          {/* Progress bar */}
          {course.enrollment && (
            <div className="glass rounded-xl p-4 border border-white/[0.06]">
              <div className="flex items-center justify-between text-sm font-body mb-2">
                <span className="text-white/50">
                  {completedLessons} de {totalLessons} aulas concluídas
                </span>
                <span className="text-white font-medium">{progress}%</span>
              </div>
              <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                  className={`h-full rounded-full ${
                    isCompleted
                      ? 'bg-gradient-to-r from-green-500 to-green-400'
                      : 'bg-gradient-to-r from-brand-500 to-brand-400'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Modules and Lessons */}
          <div className="space-y-4">
            <h2 className="text-xl font-display font-bold">Conteúdo do Curso</h2>
            {course.modules.map((module: any, moduleIndex: number) => (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: moduleIndex * 0.05 }}
                className="glass rounded-xl overflow-hidden border border-white/[0.06]"
              >
                <div className="p-4 sm:p-5 bg-white/[0.02]">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-display font-semibold">
                      <span className="text-white/30 mr-2">{String(moduleIndex + 1).padStart(2, '0')}</span>
                      {module.title}
                    </h3>
                    <span className="text-xs text-white/30 font-body">
                      {module.lessons.filter((l: any) => l.progress?.completedAt).length}/{module.lessons.length} aulas
                    </span>
                  </div>
                  {module.description && (
                    <p className="text-white/40 text-sm mt-1 font-body">{module.description}</p>
                  )}
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {module.lessons.map((lesson: any, lessonIndex: number) => {
                    const isLessonCompleted = lesson.progress?.completedAt;
                    const isLocked = false;
                    const isInProgress = lesson.progress && !isLessonCompleted && lesson.progress.percentComplete > 0;

                    return (
                      <button
                        key={lesson.id}
                        onClick={() => !isLocked && handleStartLesson(lesson.id)}
                        disabled={isLocked}
                        className="w-full p-4 flex items-center gap-4 hover:bg-white/[0.03] transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed group"
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          isLessonCompleted
                            ? 'bg-green-500/10 text-green-500'
                            : isInProgress
                            ? 'bg-brand-500/10 text-brand-500'
                            : isLocked
                            ? 'bg-white/[0.03] text-white/20'
                            : 'bg-white/[0.04] text-white/40 group-hover:text-brand-500 group-hover:bg-brand-500/10'
                        }`}>
                          {isLessonCompleted ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : isLocked ? (
                            <Lock className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4 ml-0.5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium font-body text-sm group-hover:text-white transition-colors">
                            <span className="text-white/30 mr-1.5">{lessonIndex + 1}.</span>
                            {lesson.title}
                          </h4>
                          {lesson.description && (
                            <p className="text-xs text-white/30 line-clamp-1 font-body mt-0.5">
                              {lesson.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {isInProgress && (
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1 bg-white/[0.06] rounded-full overflow-hidden hidden sm:block">
                                <div
                                  className="h-full bg-brand-500 rounded-full"
                                  style={{ width: `${lesson.progress.percentComplete}%` }}
                                />
                              </div>
                              <span className="text-xs text-brand-400 font-medium">
                                {lesson.progress.percentComplete}%
                              </span>
                            </div>
                          )}
                          <span className="text-xs text-white/30 font-body">
                            {formatDuration(lesson.durationSeconds)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
