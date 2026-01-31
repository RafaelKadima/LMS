'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useRef, useCallback } from 'react';
import { api } from '@/lib/api';
import { VideoPlayer, VideoPlayerHandle } from '@/components/player/VideoPlayer';
import { FaceDetectionOverlay } from '@/components/player/FaceDetectionOverlay';
import { ChevronLeft, ChevronRight, FileText, Download, BookOpen, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface SupportMaterial {
  url: string;
  thumbnailUrl?: string;
  fileName: string;
  mimeType: string;
  size?: number;
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  const mb = bytes / 1024 / 1024;
  return `${mb.toFixed(2)} MB`;
}

export default function PlayerPage() {
  const params = useParams();
  const router = useRouter();
  const lessonId = params.lessonId as string;
  const playerRef = useRef<VideoPlayerHandle>(null);

  const { data: lesson, isLoading } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => api.getLesson(lessonId),
  });

  const handleFacePause = useCallback(() => {
    playerRef.current?.pause();
  }, []);

  const handleFaceResume = useCallback(() => {
    playerRef.current?.play();
  }, []);

  const getVideoTime = useCallback(() => {
    return playerRef.current?.getCurrentTime() || 0;
  }, []);

  const handleComplete = () => {
    if (lesson?.navigation?.next) {
      router.push(`/player/${lesson.navigation.next.id}`);
    } else {
      router.push(`/courses/${lesson?.course?.id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="-mx-4 md:-mx-6 lg:-mx-8 -mt-4 md:-mt-6 lg:-mt-8">
        <div className="aspect-video max-h-[70vh] skeleton-shimmer" />
        <div className="px-4 md:px-6 lg:px-8 mt-6 max-w-6xl mx-auto space-y-4">
          <div className="h-7 bg-surface-card rounded-lg w-2/3 skeleton-shimmer" />
          <div className="h-4 bg-surface-card rounded-lg w-1/2 skeleton-shimmer" />
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="text-center py-20">
        <BookOpen className="w-12 h-12 text-white/20 mx-auto mb-4" />
        <p className="text-white/50 font-body text-lg">Aula não encontrada</p>
        <Link href="/catalog" className="text-brand-500 hover:underline mt-2 inline-block font-body">
          Voltar ao catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="-mx-4 md:-mx-6 lg:-mx-8 -mt-4 md:-mt-6 lg:-mt-8">
      {/* Video Player - Full width */}
      <div className="bg-black">
        {lesson.manifestUrl || lesson.videoUrl ? (
          <div className="max-h-[70vh] relative">
            <VideoPlayer
              ref={playerRef}
              lessonId={lesson.id}
              lessonTitle={lesson.title}
              courseId={lesson.course.id}
              courseTitle={lesson.course.title}
              manifestUrl={lesson.manifestUrl}
              videoUrl={lesson.videoUrl}
              startPosition={lesson.progress?.lastPositionSeconds || 0}
              duration={lesson.durationSeconds}
              onComplete={handleComplete}
            />
            <FaceDetectionOverlay
              courseId={lesson.course.id}
              lessonId={lesson.id}
              onPauseRequest={handleFacePause}
              onResumeRequest={handleFaceResume}
              getVideoTime={getVideoTime}
            />
          </div>
        ) : (
          <div className="aspect-video max-h-[70vh] flex items-center justify-center bg-surface-card">
            <p className="text-white/40 font-body">
              {lesson.processingStatus === 'processing'
                ? 'Vídeo em processamento...'
                : 'Vídeo não disponível'}
            </p>
          </div>
        )}
      </div>

      {/* Content below player */}
      <div className="px-4 md:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Lesson info + Navigation row */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-5 flex flex-col md:flex-row md:items-start md:justify-between gap-4"
          >
            <div className="flex-1 min-w-0">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-xs text-white/30 font-body mb-2">
                <Link href="/catalog" className="hover:text-white/60 transition-colors">
                  Catálogo
                </Link>
                <span>/</span>
                <Link href={`/courses/${lesson.course.id}`} className="hover:text-white/60 transition-colors truncate max-w-[200px]">
                  {lesson.course.title}
                </Link>
              </div>

              <h1 className="text-xl md:text-2xl font-display font-bold tracking-tight">
                {lesson.title}
              </h1>
              {lesson.description && (
                <p className="mt-2 text-sm text-white/50 font-body leading-relaxed max-w-2xl">
                  {lesson.description}
                </p>
              )}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {lesson.navigation.prev ? (
                <Link
                  href={`/player/${lesson.navigation.prev.id}`}
                  className="flex items-center gap-1.5 px-4 py-2.5 glass rounded-lg border border-white/[0.06] hover:border-white/[0.12] transition-colors font-body text-sm text-white/60 hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Anterior</span>
                </Link>
              ) : (
                <Link
                  href={`/courses/${lesson.course.id}`}
                  className="flex items-center gap-1.5 px-4 py-2.5 glass rounded-lg border border-white/[0.06] hover:border-white/[0.12] transition-colors font-body text-sm text-white/60 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Curso</span>
                </Link>
              )}

              {lesson.navigation.next ? (
                <Link
                  href={`/player/${lesson.navigation.next.id}`}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-white text-black rounded-lg transition-colors font-display text-sm font-semibold hover:bg-white/90 active:scale-[0.98]"
                >
                  <span className="hidden sm:inline">Próxima</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              ) : (
                <Link
                  href={`/courses/${lesson.course.id}`}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-display text-sm font-semibold active:scale-[0.98]"
                >
                  <span>Concluir</span>
                </Link>
              )}
            </div>
          </motion.div>

          {/* Support Materials */}
          {lesson.supportMaterials && lesson.supportMaterials.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="mt-8 glass rounded-xl p-5 border border-white/[0.06]"
            >
              <h2 className="text-base font-display font-semibold mb-4">Materiais de Apoio</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(lesson.supportMaterials as SupportMaterial[]).map((material, index) => (
                  <a
                    key={index}
                    href={material.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-lg border border-white/[0.04] hover:border-brand-500/30 hover:bg-white/[0.05] transition-all group"
                  >
                    {material.thumbnailUrl ? (
                      <img
                        src={material.thumbnailUrl}
                        alt={material.fileName}
                        className="w-10 h-14 object-cover rounded-md flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-14 bg-brand-500/10 rounded-md flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-brand-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-body truncate group-hover:text-brand-400 transition-colors">
                        {material.fileName}
                      </p>
                      {material.size && (
                        <p className="text-xs text-white/30 font-body">
                          {formatFileSize(material.size)}
                        </p>
                      )}
                    </div>
                    <Download className="w-4 h-4 text-white/20 group-hover:text-brand-500 flex-shrink-0 transition-colors" />
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
