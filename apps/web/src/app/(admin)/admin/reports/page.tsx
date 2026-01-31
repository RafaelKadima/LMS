'use client';

import { useEffect, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Clock,
  BookOpen,
  Users,
  TrendingUp,
  Search,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { PageHeader } from '@/components/admin';
import { api } from '@/lib/api';

interface UserProgress {
  user: {
    id: string;
    name: string;
    email: string;
    cargo: string;
    franchise?: { id: string; name: string };
    store?: { id: string; name: string };
  };
  coursesEnrolled: number;
  coursesCompleted: number;
  overallProgress: number;
  totalLessonsWatched: number;
  totalSecondsWatched: number;
  lastActivityAt: string | null;
  enrollments: {
    courseId: string;
    courseTitle: string;
    status: string;
    progress: number;
    completedLessons: number;
    totalLessons: number;
    startedAt: string;
    completedAt: string | null;
  }[];
}

interface ReportsResponse {
  data: UserProgress[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
  summary: {
    totalUsers: number;
    averageProgress: number;
    completionRate: number;
  };
}

const cargoLabels: Record<string, string> = {
  mecanico: 'Mecânico',
  atendente: 'Atendente',
  gerente: 'Gerente',
  proprietario: 'Proprietário',
};

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}min`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}min`;
}

function ProgressBar({ value, className = '' }: { value: number; className?: string }) {
  return (
    <div className={`h-2 bg-white/[0.08] rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all"
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  );
}

function StatsCard({ icon: Icon, label, value, subtext }: { icon: any; label: string; value: string | number; subtext?: string }) {
  return (
    <div className="glass rounded-2xl p-6 border border-white/[0.06]">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-brand-500/10 flex items-center justify-center">
          <Icon className="w-6 h-6 text-brand-500" />
        </div>
        <div>
          <p className="text-sm text-white/50">{label}</p>
          <p className="text-2xl font-display font-bold tracking-tight text-white">{value}</p>
          {subtext && <p className="text-xs text-white/40">{subtext}</p>}
        </div>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [data, setData] = useState<UserProgress[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, perPage: 20, totalPages: 1 });
  const [summary, setSummary] = useState({ totalUsers: 0, averageProgress: 0, completionRate: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const fetchReports = async (page = 1, search = searchTerm) => {
    setIsLoading(true);
    try {
      const response: ReportsResponse = await api.admin.getProgressReport({
        page,
        perPage: 20,
        search: search || undefined,
      });
      setData(response.data);
      setMeta(response.meta);
      setSummary(response.summary);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(searchInput);
    fetchReports(1, searchInput);
  };

  const toggleRow = (userId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const totalPages = Math.ceil(meta.total / meta.perPage);

  return (
    <div>
      <PageHeader
        title="Relatórios de Progresso"
        description="Acompanhe o progresso de aprendizado dos usuários"
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Relatórios' },
        ]}
      />

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatsCard
          icon={Users}
          label="Total de Usuários"
          value={summary.totalUsers}
          subtext="com matrículas ativas"
        />
        <StatsCard
          icon={TrendingUp}
          label="Progresso Médio"
          value={`${Math.round(summary.averageProgress)}%`}
          subtext="de todos os cursos"
        />
        <StatsCard
          icon={BookOpen}
          label="Taxa de Conclusão"
          value={`${Math.round(summary.completionRate)}%`}
          subtext="cursos finalizados"
        />
      </div>

      {/* Data Table */}
      <div className="glass rounded-2xl border border-white/[0.06] overflow-hidden">
        {/* Search */}
        <form onSubmit={handleSearch} className="p-4 border-b border-white/[0.06]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>
        </form>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="px-4 py-3 text-left text-sm font-medium text-white/50 w-10"></th>
                <th className="px-4 py-3 text-left text-sm font-medium text-white/50">Usuário</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-white/50">Cargo</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-white/50">Franquia/Loja</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-white/50">Cursos</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-white/50">Progresso</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-white/50">Tempo Assistido</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-white/50">Última Atividade</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-white/40">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-brand-500"></div>
                      <span>Carregando...</span>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-white/40">
                    Nenhum usuário com matrícula encontrado
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <>
                    {/* Main Row */}
                    <tr
                      key={item.user.id}
                      onClick={() => toggleRow(item.user.id)}
                      className="border-b border-white/[0.06] cursor-pointer hover:bg-white/[0.06] transition-colors"
                    >
                      <td className="px-4 py-4">
                        <button className="p-1 rounded hover:bg-white/[0.06] transition-colors">
                          {expandedRows.has(item.user.id) ? (
                            <ChevronDown className="w-4 h-4 text-white/50" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-white/50" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-white">{item.user.name}</p>
                          <p className="text-xs text-white/40">{item.user.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-white/70">{cargoLabels[item.user.cargo] || item.user.cargo}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm">
                          <p className="text-white/70">{item.user.franchise?.name || '-'}</p>
                          {item.user.store && (
                            <p className="text-xs text-white/40">{item.user.store.name}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-center">
                          <span className="text-brand-500 font-medium">{item.coursesCompleted}</span>
                          <span className="text-white/40"> / {item.coursesEnrolled}</span>
                          <p className="text-xs text-white/40">concluídos</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="w-32">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-white/50">Média</span>
                            <span className="text-white font-medium">{Math.round(item.overallProgress)}%</span>
                          </div>
                          <ProgressBar value={item.overallProgress} />
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-white/70">
                          <Clock className="w-4 h-4 text-white/40" />
                          {formatDuration(item.totalSecondsWatched)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-white/50 text-sm">
                          {item.lastActivityAt
                            ? new Date(item.lastActivityAt).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Nunca'}
                        </span>
                      </td>
                    </tr>

                    {/* Expanded Row */}
                    {expandedRows.has(item.user.id) && (
                      <tr key={`${item.user.id}-expanded`}>
                        <td colSpan={8} className="px-6 py-4 bg-white/[0.06]/50">
                          <div className="space-y-3">
                            <p className="text-sm font-medium text-white/70 mb-3">
                              Detalhes dos cursos matriculados:
                            </p>
                            {item.enrollments.length === 0 ? (
                              <p className="text-white/40 text-sm">Nenhuma matrícula encontrada</p>
                            ) : (
                              <div className="grid gap-3">
                                {item.enrollments.map((enrollment) => (
                                  <div
                                    key={enrollment.courseId}
                                    className="flex items-center justify-between p-3 glass rounded-xl border border-white/[0.06]"
                                  >
                                    <div className="flex-1">
                                      <p className="font-medium text-white">{enrollment.courseTitle}</p>
                                      <p className="text-xs text-white/40">
                                        Iniciado em {new Date(enrollment.startedAt).toLocaleDateString('pt-BR')}
                                        {enrollment.completedAt && (
                                          <> • Concluído em {new Date(enrollment.completedAt).toLocaleDateString('pt-BR')}</>
                                        )}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-6">
                                      <div className="text-center">
                                        <p className="text-sm font-medium text-white">
                                          {enrollment.completedLessons}/{enrollment.totalLessons}
                                        </p>
                                        <p className="text-xs text-white/40">aulas</p>
                                      </div>
                                      <div className="w-24">
                                        <div className="flex justify-between text-xs mb-1">
                                          <span className="text-white/40">Progresso</span>
                                          <span className={enrollment.progress === 100 ? 'text-green-500' : 'text-white'}>
                                            {Math.round(enrollment.progress)}%
                                          </span>
                                        </div>
                                        <ProgressBar value={enrollment.progress} />
                                      </div>
                                      <span
                                        className={`px-2 py-1 rounded text-xs font-medium ${
                                          enrollment.status === 'completed'
                                            ? 'bg-green-500/10 text-green-500'
                                            : 'bg-yellow-500/10 text-yellow-500'
                                        }`}
                                      >
                                        {enrollment.status === 'completed' ? 'Concluído' : 'Em andamento'}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-white/[0.06] flex items-center justify-between">
            <p className="text-sm text-white/50">
              Mostrando {(meta.page - 1) * meta.perPage + 1} -{' '}
              {Math.min(meta.page * meta.perPage, meta.total)} de {meta.total}
            </p>

            <div className="flex items-center gap-1">
              <button
                onClick={() => fetchReports(1)}
                disabled={meta.page === 1}
                className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => fetchReports(meta.page - 1)}
                disabled={meta.page === 1}
                className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 text-sm text-white/50">
                {meta.page} / {totalPages}
              </span>

              <button
                onClick={() => fetchReports(meta.page + 1)}
                disabled={meta.page === totalPages}
                className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => fetchReports(totalPages)}
                disabled={meta.page === totalPages}
                className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
