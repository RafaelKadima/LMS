'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Trophy, Lock, Award, Star } from 'lucide-react';

interface Badge {
  id: string;
  name: string;
  description?: string;
  iconUrl?: string;
  awardedAt?: string;
}

interface BadgesData {
  earned: Badge[];
  available: Badge[];
  totalEarned: number;
  totalAvailable: number;
}

function BadgeCard({ badge, earned = false }: { badge: Badge; earned?: boolean }) {
  return (
    <div
      className={`relative bg-surface-card rounded-xl p-6 border transition-all ${
        earned
          ? 'border-yellow-500/30 bg-gradient-to-br from-yellow-500/5 to-transparent'
          : 'border-gray-800 opacity-60'
      }`}
    >
      {/* Badge icon */}
      <div className="flex justify-center mb-4">
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center ${
            earned
              ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg shadow-yellow-500/30'
              : 'bg-gray-700'
          }`}
        >
          {badge.iconUrl ? (
            <img
              src={badge.iconUrl}
              alt={badge.name}
              className="w-12 h-12 object-contain"
            />
          ) : earned ? (
            <Trophy className="w-10 h-10 text-white" />
          ) : (
            <Lock className="w-8 h-8 text-gray-500" />
          )}
        </div>
      </div>

      {/* Badge info */}
      <div className="text-center">
        <h3 className={`font-semibold ${earned ? 'text-white' : 'text-gray-400'}`}>
          {badge.name}
        </h3>
        {badge.description && (
          <p className="mt-1 text-sm text-gray-500 line-clamp-2">{badge.description}</p>
        )}
        {earned && badge.awardedAt && (
          <p className="mt-2 text-xs text-yellow-500">
            Conquistado em {new Date(badge.awardedAt).toLocaleDateString('pt-BR')}
          </p>
        )}
      </div>

      {/* Earned indicator */}
      {earned && (
        <div className="absolute top-3 right-3">
          <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center">
            <Star className="w-4 h-4 text-white fill-white" />
          </div>
        </div>
      )}
    </div>
  );
}

export default function AchievementsPage() {
  const { data: badges, isLoading } = useQuery<BadgesData>({
    queryKey: ['my-badges'],
    queryFn: () => api.getMyBadges(),
  });

  const progressPercent = badges
    ? Math.round((badges.totalEarned / badges.totalAvailable) * 100) || 0
    : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Conquistas</h1>
        <p className="mt-2 text-gray-400">
          Desbloqueie badges completando cursos e alcançando marcos
        </p>
      </div>

      {/* Progress card */}
      <div className="bg-surface-card rounded-xl p-6 border border-gray-800">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
            <Award className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-white">Seu progresso</h2>
              <span className="text-yellow-500 font-bold">
                {badges?.totalEarned || 0} / {badges?.totalAvailable || 0}
              </span>
            </div>
            <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              {progressPercent}% das conquistas desbloqueadas
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-surface-card rounded-xl h-48 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Earned badges */}
          {badges?.earned && badges.earned.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Conquistas Desbloqueadas ({badges.earned.length})
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {badges.earned.map((badge) => (
                  <BadgeCard key={badge.id} badge={badge} earned />
                ))}
              </div>
            </section>
          )}

          {/* Available badges */}
          {badges?.available && badges.available.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5 text-gray-500" />
                Disponíveis para Desbloquear ({badges.available.length})
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {badges.available.map((badge) => (
                  <BadgeCard key={badge.id} badge={badge} />
                ))}
              </div>
            </section>
          )}

          {/* Empty state */}
          {(!badges?.earned?.length && !badges?.available?.length) && (
            <div className="text-center py-12 bg-surface-card rounded-xl">
              <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-300">Nenhuma conquista disponível</h3>
              <p className="text-gray-500 mt-1">
                As conquistas aparecerão aqui quando estiverem configuradas
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
