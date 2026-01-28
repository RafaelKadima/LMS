'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { VideoPlayer } from '@/components/player/VideoPlayer';
import { ChevronLeft, ChevronRight, FileText, Download } from 'lucide-react';
import Link from 'next/link';

// Interface para material de apoio
interface SupportMaterial {
  url: string;
  thumbnailUrl?: string;
  fileName: string;
  mimeType: string;
  size?: number;
}

// Função para formatar tamanho do arquivo
function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  const mb = bytes / 1024 / 1024;
  return `${mb.toFixed(2)} MB`;
}

export default function PlayerPage() {
  const params = useParams();
  const router = useRouter();
  const lessonId = params.lessonId as string;

  const { data: lesson, isLoading } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => api.getLesson(lessonId),
  });

  const handleComplete = () => {
    // Auto-navigate to next lesson
    if (lesson?.navigation?.next) {
      router.push(`/player/${lesson.navigation.next.id}`);
    } else {
      // Go back to course
      router.push(`/courses/${lesson?.course?.id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (!lesson) {
    return <div>Aula não encontrada</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-400">
        <Link href="/catalog" className="hover:text-white">
          Catálogo
        </Link>
        <span>/</span>
        <Link href={`/courses/${lesson.course.id}`} className="hover:text-white">
          {lesson.course.title}
        </Link>
        <span>/</span>
        <span className="text-white">{lesson.title}</span>
      </div>

      {/* Player */}
      <div className="rounded-xl overflow-hidden bg-black">
        {lesson.manifestUrl || lesson.videoUrl ? (
          <VideoPlayer
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
        ) : (
          <div className="aspect-video flex items-center justify-center bg-surface-card">
            <p className="text-gray-400">
              {lesson.processingStatus === 'processing'
                ? 'Vídeo em processamento...'
                : 'Vídeo não disponível'}
            </p>
          </div>
        )}
      </div>

      {/* Lesson info */}
      <div className="mt-6">
        <h1 className="text-2xl font-bold">{lesson.title}</h1>
        {lesson.description && (
          <p className="mt-2 text-gray-400">{lesson.description}</p>
        )}
      </div>

      {/* Materiais de Apoio */}
      {lesson.supportMaterials && lesson.supportMaterials.length > 0 && (
        <div className="mt-6 bg-surface-card rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Materiais de Apoio</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(lesson.supportMaterials as SupportMaterial[]).map((material, index) => (
              <a
                key={index}
                href={material.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-surface-hover rounded-lg border border-gray-700 hover:border-brand-500 transition-colors group"
              >
                {/* Thumbnail ou ícone */}
                {material.thumbnailUrl ? (
                  <img
                    src={material.thumbnailUrl}
                    alt={material.fileName}
                    className="w-12 h-16 object-cover rounded flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-16 bg-green-500/20 rounded flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-green-500" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate group-hover:text-brand-500 transition-colors">
                    {material.fileName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(material.size)}
                  </p>
                </div>
                <Download className="w-4 h-4 text-gray-500 group-hover:text-brand-500 flex-shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-6 flex justify-between">
        {lesson.navigation.prev ? (
          <Link
            href={`/player/${lesson.navigation.prev.id}`}
            className="flex items-center gap-2 px-4 py-2 bg-surface-card hover:bg-surface-hover rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Aula anterior</span>
          </Link>
        ) : (
          <div />
        )}

        {lesson.navigation.next ? (
          <Link
            href={`/player/${lesson.navigation.next.id}`}
            className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors"
          >
            <span className="hidden sm:inline">Próxima aula</span>
            <ChevronRight className="w-5 h-5" />
          </Link>
        ) : (
          <Link
            href={`/courses/${lesson.course.id}`}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
          >
            <span>Voltar ao curso</span>
          </Link>
        )}
      </div>
    </div>
  );
}
