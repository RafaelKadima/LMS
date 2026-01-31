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
      className={`relative glass rounded-xl p-6 border transition-all ${
        earned
          ? 'border-accent-gold/30 bg-gradient-to-br from-accent-gold/[0.05] to-transparent'
          : 'border-white/[0.06] opacity-60'
      }`}
    >
      <div className="flex justify-center mb-4">
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center ${
            earned
              ? 'bg-gradient-to-br from-accent-gold to-yellow-600 shadow-lg shadow-accent-gold/30'
              : 'bg-white/[0.06]'
          }`}
        >
          {badge.iconUrl ? (
            <img src={badge.iconUrl} alt={badge.name} className="w-12 h-12 object-contain" />
          ) : earned ? (
            <Trophy className="w-10 h-10 text-white" />
          ) : (
            <Lock className="w-8 h-8 text-white/30" />
          )}
        </div>
      </div>

      <div className="text-center">
        <h3 className={`font-display font-semibold ${earned ? 'text-white' : 'text-white/40'}`}>
          {badge.name}
        </h3>
        {badge.description && (
          <p className="mt-1 text-sm text-white/40 line-clamp-2 font-body">{badge.description}</p>
        )}
        {earned && badge.awardedAt && (
          <p className="mt-2 text-xs text-accent-gold font-body">
            Conquistado em {new Date(badge.awardedAt).toLocaleDateString('pt-BR')}
          </p>
        )}
      </div>

      {earned && (
        <div className="absolute top-3 right-3">
          <div className="w-6 h-6 rounded-full bg-accent-gold flex items-center justify-center">
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
        <h1 className="text-3xl font-display font-bold tracking-tight">Conquistas</h1>
        <p className="mt-2 text-white/50 font-body">
          Desbloqueie badges completando cursos e alcançando marcos
        </p>
      </div>

      {/* Progress card */}
      <div className="glass rounded-2xl p-6 border border-white/[0.06]">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent-gold to-yellow-600 flex items-center justify-center shadow-lg shadow-accent-gold/20">
            <Award className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-display font-semibold text-white">Seu progresso</h2>
              <span className="text-accent-gold font-display font-bold">
                {badges?.totalEarned || 0} / {badges?.totalAvailable || 0}
              </span>
            </div>
            <div className="h-3 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent-gold to-yellow-600 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-white/40 font-body">
              {progressPercent}% das conquistas desbloqueadas
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-surface-card rounded-xl h-48 skeleton-shimmer" />
          ))}
        </div>
      ) : (
        <>
          {badges?.earned && badges.earned.length > 0 && (
            <section>
              <h2 className="text-xl font-display font-semibold mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-accent-gold" />
                Conquistas Desbloqueadas ({badges.earned.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {badges.earned.map((badge) => (
                  <BadgeCard key={badge.id} badge={badge} earned />
                ))}
              </div>
            </section>
          )}

          {badges?.available && badges.available.length > 0 && (
            <section>
              <h2 className="text-xl font-display font-semibold mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5 text-white/40" />
                Disponíveis para Desbloquear ({badges.available.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {badges.available.map((badge) => (
                  <BadgeCard key={badge.id} badge={badge} />
                ))}
              </div>
            </section>
          )}

          {(!badges?.earned?.length && !badges?.available?.length) && (
            <div className="text-center py-16 glass rounded-2xl border border-white/[0.06]">
              <Trophy className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <h3 className="text-lg font-display font-medium text-white/70">Nenhuma conquista disponível</h3>
              <p className="text-white/40 mt-1 font-body">
                As conquistas aparecerão aqui quando estiverem configuradas
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
