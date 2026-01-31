'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  Building2,
  Store,
  BookOpen,
  GraduationCap,
  Award,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { PageHeader, StatsCard } from '@/components/admin';
import { api } from '@/lib/api';

interface DashboardStats {
  overview: {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    totalFranchises: number;
    totalStores: number;
    totalCourses: number;
    publishedCourses: number;
    draftCourses: number;
    totalEnrollments: number;
    completedEnrollments: number;
    completionRate: number;
    totalBadges: number;
    totalBadgeAwards: number;
  };
  charts: {
    usersByRole: { role: string; count: number }[];
    enrollmentsByStatus: { status: string; count: number }[];
  };
  recentEnrollments: {
    id: string;
    user: { id: string; name: string; email: string; avatarUrl?: string };
    course: { id: string; title: string; thumbnailUrl?: string };
    status: string;
    progress: number;
    startedAt: string;
  }[];
  topCourses: {
    id: string;
    title: string;
    thumbnailUrl?: string;
    enrollmentsCount: number;
  }[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.admin.getDashboardStats();
        setStats(data);
      } catch (err) {
        setError('Erro ao carregar estatísticas');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="text-center text-red-500 py-8">
        {error || 'Erro ao carregar dados'}
      </div>
    );
  }

  const { overview, recentEnrollments, topCourses } = stats;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Visão geral da plataforma de aprendizagem"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 stagger-children">
        <StatsCard
          title="Usuários Ativos"
          value={overview.activeUsers}
          subtitle={`${overview.totalUsers} total`}
          icon={Users}
        />
        <StatsCard
          title="Franquias"
          value={overview.totalFranchises}
          subtitle={`${overview.totalStores} lojas`}
          icon={Building2}
        />
        <StatsCard
          title="Cursos"
          value={overview.publishedCourses}
          subtitle={`${overview.draftCourses} em rascunho`}
          icon={BookOpen}
        />
        <StatsCard
          title="Matrículas"
          value={overview.totalEnrollments}
          subtitle={`${overview.completionRate}% concluídas`}
          icon={GraduationCap}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
        <StatsCard
          title="Badges Criados"
          value={overview.totalBadges}
          subtitle={`${overview.totalBadgeAwards} conquistados`}
          icon={Award}
        />
        <StatsCard
          title="Taxa de Conclusão"
          value={`${overview.completionRate}%`}
          subtitle={`${overview.completedEnrollments} cursos concluídos`}
          icon={TrendingUp}
        />
        <StatsCard
          title="Lojas Ativas"
          value={overview.totalStores}
          icon={Store}
        />
      </div>

      {/* Recent Activity and Top Courses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 stagger-children">
        {/* Recent Enrollments */}
        <div className="glass rounded-2xl border border-white/[0.06] p-6 hover:border-white/[0.12] transition-colors">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-display font-semibold tracking-tight text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-500" />
              Matrículas Recentes
            </h2>
          </div>

          {recentEnrollments.length === 0 ? (
            <p className="text-white/40 text-center py-8">
              Nenhuma matrícula recente
            </p>
          ) : (
            <div className="space-y-4">
              {recentEnrollments.slice(0, 5).map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/[0.04] transition-colors"
                >
                  <div className="w-10 h-10 bg-white/[0.06] rounded-full flex items-center justify-center text-white font-medium">
                    {enrollment.user.avatarUrl ? (
                      <img
                        src={enrollment.user.avatarUrl}
                        alt={enrollment.user.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      enrollment.user.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {enrollment.user.name}
                    </p>
                    <p className="text-xs text-white/50 truncate">
                      {enrollment.course.title}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-brand-500">
                      {enrollment.progress}%
                    </p>
                    <p className="text-xs text-white/40">
                      {new Date(enrollment.startedAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Courses */}
        <div className="glass rounded-2xl border border-white/[0.06] p-6 hover:border-white/[0.12] transition-colors">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-display font-semibold tracking-tight text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-500" />
              Cursos Mais Populares
            </h2>
          </div>

          {topCourses.length === 0 ? (
            <p className="text-white/40 text-center py-8">
              Nenhum curso encontrado
            </p>
          ) : (
            <div className="space-y-4">
              {topCourses.map((course, index) => (
                <div
                  key={course.id}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/[0.04] transition-colors"
                >
                  <div className="w-10 h-10 bg-white/[0.06] rounded-lg flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {course.title}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-brand-500">
                      {course.enrollmentsCount}
                    </p>
                    <p className="text-xs text-white/40">matrículas</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
