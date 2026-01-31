'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import { BookOpen, Clock } from 'lucide-react';

interface Track {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  isRequired: boolean;
  coursesCount: number;
  courses: {
    id: string;
    title: string;
    thumbnailUrl?: string;
    durationMinutes: number;
  }[];
}

function TrackCard({ track }: { track: Track }) {
  const totalDuration = track.courses.reduce((acc, c) => acc + (c.durationMinutes || 0), 0);

  return (
    <Link
      href={`/tracks/${track.id}`}
      className="group bg-surface-card rounded-xl overflow-hidden border border-white/[0.06] hover:border-brand-500/30 transition-all duration-300"
    >
      <div className="relative aspect-video bg-white/[0.04]">
        {track.thumbnailUrl ? (
          <img src={track.thumbnailUrl} alt={track.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-white/20" />
          </div>
        )}
        {track.isRequired && (
          <span className="absolute top-2.5 right-2.5 bg-red-500/90 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-lg font-medium">
            Obrigatória
          </span>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-lg font-display font-semibold text-white group-hover:text-brand-400 transition-colors line-clamp-2">
          {track.title}
        </h3>
        {track.description && (
          <p className="mt-2 text-sm text-white/40 line-clamp-2 font-body">{track.description}</p>
        )}

        <div className="mt-4 flex items-center gap-4 text-sm text-white/40 font-body">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" />
            <span>{track.coursesCount} cursos</span>
          </div>
          {totalDuration > 0 && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>{totalDuration} min</span>
            </div>
          )}
        </div>

        {track.courses.length > 0 && (
          <div className="mt-4 flex -space-x-2">
            {track.courses.slice(0, 4).map((course, i) => (
              <div
                key={course.id}
                className="w-8 h-8 rounded-full border-2 border-surface-card overflow-hidden bg-white/[0.06]"
                title={course.title}
              >
                {course.thumbnailUrl ? (
                  <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-white/40">
                    {i + 1}
                  </div>
                )}
              </div>
            ))}
            {track.courses.length > 4 && (
              <div className="w-8 h-8 rounded-full border-2 border-surface-card bg-white/[0.06] flex items-center justify-center text-xs text-white/40">
                +{track.courses.length - 4}
              </div>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

export default function TracksPage() {
  const { data: tracks, isLoading } = useQuery({
    queryKey: ['tracks'],
    queryFn: () => api.getTracks(),
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight">Trilhas de Aprendizado</h1>
        <p className="mt-2 text-white/50 font-body">
          Siga trilhas organizadas para desenvolver suas habilidades de forma estruturada
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-surface-card rounded-xl h-80 skeleton-shimmer" />
          ))}
        </div>
      ) : tracks && tracks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {tracks.map((track: Track) => (
            <TrackCard key={track.id} track={track} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 glass rounded-2xl border border-white/[0.06]">
          <BookOpen className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-display font-medium text-white/70">Nenhuma trilha disponível</h3>
          <p className="text-white/40 mt-1 font-body">
            As trilhas de aprendizado aparecerão aqui quando estiverem disponíveis para você
          </p>
        </div>
      )}
    </div>
  );
}
