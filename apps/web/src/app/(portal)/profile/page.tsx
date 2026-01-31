'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import { BookOpen, Clock, CheckCircle, Play, Target, TrendingUp, Fingerprint, Trash2, Plus } from 'lucide-react';
import { useWebAuthn } from '@/hooks/useWebAuthn';
import { useState } from 'react';

interface CourseProgress {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  durationMinutes: number;
  lessonsCount: number;
  progress: number;
  status: 'active' | 'completed' | 'expired' | 'cancelled' | null;
  isRequired: boolean;
}

function ProgressCard({ course }: { course: CourseProgress }) {
  const isCompleted = course.status === 'completed';
  const inProgress = course.progress > 0 && !isCompleted;

  return (
    <div className="glass rounded-xl overflow-hidden border border-white/[0.06] hover:border-white/[0.12] transition-colors">
      <div className="flex flex-col sm:flex-row">
        <div className="w-full sm:w-32 h-32 sm:h-24 flex-shrink-0 bg-white/[0.04]">
          {course.thumbnailUrl ? (
            <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-8 h-8 text-white/20" /></div>
          )}
        </div>

        <div className="flex-1 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-white truncate font-body">{course.title}</h3>
                {course.isRequired && (
                  <span className="text-xs bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded-md shrink-0">Obrigatório</span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-white/40 font-body">
                <span>{course.lessonsCount} aulas</span>
                {course.durationMinutes > 0 && <span>{course.durationMinutes} min</span>}
              </div>
            </div>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium shrink-0 ${
              isCompleted ? 'bg-green-500/15 text-green-400' : inProgress ? 'bg-brand-500/15 text-brand-400' : 'bg-white/[0.06] text-white/40'
            }`}>
              {isCompleted ? <><CheckCircle className="w-3 h-3" />Concluído</> :
               inProgress ? <><Play className="w-3 h-3" />Em progresso</> :
               <><Clock className="w-3 h-3" />Não iniciado</>}
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1 font-body">
              <span className="text-white/40">Progresso</span>
              <span className="text-white">{course.progress}%</span>
            </div>
            <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isCompleted ? 'bg-green-500' : 'bg-gradient-to-r from-brand-500 to-brand-400'}`}
                style={{ width: `${course.progress}%` }}
              />
            </div>
          </div>

          <div className="mt-3">
            <Link href={`/courses/${course.id}`} className="text-sm text-brand-500 hover:text-brand-400 font-medium font-body">
              {isCompleted ? 'Revisar curso' : inProgress ? 'Continuar' : 'Começar'} →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { data: catalog, isLoading: loadingCatalog } = useQuery({ queryKey: ['catalog'], queryFn: () => api.getCatalog({}) });
  const { data: continueWatching } = useQuery({ queryKey: ['continue-watching'], queryFn: () => api.getContinueWatching() });
  const { data: required } = useQuery({ queryKey: ['required'], queryFn: () => api.getRequired() });
  const { data: passkeys } = useQuery({ queryKey: ['webauthn-credentials'], queryFn: () => api.webauthn.listCredentials() });
  const { isSupported: passkeySupported, isLoading: passkeyLoading, error: passkeyError, registerPasskey, clearError } = useWebAuthn();
  const [deviceName, setDeviceName] = useState('');

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.webauthn.deleteCredential(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['webauthn-credentials'] }),
  });

  const handleAddPasskey = async () => {
    clearError();
    try {
      await registerPasskey(deviceName || undefined);
      setDeviceName('');
      queryClient.invalidateQueries({ queryKey: ['webauthn-credentials'] });
    } catch {
      // Error handled by hook
    }
  };

  const enrolledCourses = catalog?.data?.filter((c: CourseProgress) => c.progress > 0 || c.status) || [];
  const completedCourses = enrolledCourses.filter((c: CourseProgress) => c.status === 'completed');
  const inProgressCourses = enrolledCourses.filter((c: CourseProgress) => c.progress > 0 && c.status !== 'completed');

  const totalCompleted = completedCourses.length;
  const totalInProgress = inProgressCourses.length;
  const totalLessonsWatched = continueWatching?.length || 0;
  const requiredCompleted = required?.filter((c: any) => c.completed)?.length || 0;
  const requiredTotal = required?.length || 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight">Meu Progresso</h1>
        <p className="mt-2 text-white/50 font-body">Acompanhe seu progresso de aprendizado</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: CheckCircle, color: 'green', value: totalCompleted, label: 'Concluídos' },
          { icon: TrendingUp, color: 'brand', value: totalInProgress, label: 'Em andamento' },
          { icon: BookOpen, color: 'purple', value: totalLessonsWatched, label: 'Assistindo' },
          { icon: Target, color: 'red', value: `${requiredCompleted}/${requiredTotal}`, label: 'Obrigatórios' },
        ].map((stat, i) => (
          <div key={i} className="glass rounded-xl p-4 border border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-${stat.color}-500/15 flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 text-${stat.color}-500`} />
              </div>
              <div>
                <p className="text-2xl font-display font-bold text-white">{stat.value}</p>
                <p className="text-sm text-white/40 font-body">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Required courses section */}
      {required && required.length > 0 && (
        <section>
          <h2 className="text-xl font-display font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-red-500" /> Cursos Obrigatórios
          </h2>
          <div className="space-y-3">
            {required.map((course: any) => (
              <ProgressCard key={course.id} course={{ ...course, status: course.completed ? 'completed' : course.progress > 0 ? 'active' : null, isRequired: true }} />
            ))}
          </div>
        </section>
      )}

      {inProgressCourses.length > 0 && (
        <section>
          <h2 className="text-xl font-display font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-500" /> Em Andamento
          </h2>
          <div className="space-y-3">
            {inProgressCourses.map((course: CourseProgress) => (<ProgressCard key={course.id} course={course} />))}
          </div>
        </section>
      )}

      {completedCourses.length > 0 && (
        <section>
          <h2 className="text-xl font-display font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" /> Concluídos
          </h2>
          <div className="space-y-3">
            {completedCourses.map((course: CourseProgress) => (<ProgressCard key={course.id} course={course} />))}
          </div>
        </section>
      )}

      {enrolledCourses.length === 0 && !loadingCatalog && (
        <div className="text-center py-16 glass rounded-2xl border border-white/[0.06]">
          <BookOpen className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-display font-medium text-white/70">Nenhum curso iniciado</h3>
          <p className="text-white/40 mt-1 mb-4 font-body">Comece a aprender explorando nosso catálogo de cursos</p>
          <Link href="/catalog" className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors shadow-glow font-medium">
            Explorar catálogo
          </Link>
        </div>
      )}

      {/* Passkeys Section */}
      <section>
        <h2 className="text-xl font-display font-semibold mb-4 flex items-center gap-2">
          <Fingerprint className="w-5 h-5 text-brand-500" /> Passkeys
        </h2>
        <div className="glass rounded-xl border border-white/[0.06] p-6">
          <p className="text-sm text-white/40 font-body mb-4">
            Passkeys permitem login rapido e seguro usando biometria do seu dispositivo (impressao digital, Face ID, etc).
          </p>

          {passkeys && passkeys.length > 0 && (
            <div className="space-y-0 mb-4">
              {passkeys.map((cred: any) => (
                <div key={cred.id} className="flex items-center justify-between py-3 border-b border-white/[0.06] last:border-0">
                  <div>
                    <p className="text-white font-medium font-body">{cred.deviceName || 'Passkey'}</p>
                    <p className="text-sm text-white/40 font-body">
                      Criada em {new Date(cred.createdAt).toLocaleDateString('pt-BR')}
                      {cred.lastUsedAt && ` · Ultimo uso: ${new Date(cred.lastUsedAt).toLocaleDateString('pt-BR')}`}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteMutation.mutate(cred.id)}
                    disabled={deleteMutation.isPending}
                    className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                    title="Remover passkey"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {passkeySupported ? (
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="Nome do dispositivo (opcional)"
                className="flex-1 px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors font-body text-sm"
              />
              <button
                onClick={handleAddPasskey}
                disabled={passkeyLoading}
                className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-body text-sm font-medium shrink-0"
              >
                <Plus className="w-4 h-4" />
                {passkeyLoading ? 'Registrando...' : 'Adicionar Passkey'}
              </button>
            </div>
          ) : (
            <p className="text-sm text-white/30 font-body">Seu navegador nao suporta passkeys.</p>
          )}

          {passkeyError && (
            <p className="text-sm text-red-400 mt-2 font-body">{passkeyError}</p>
          )}
        </div>
      </section>
    </div>
  );
}
