'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { PageHeader } from '@/components/admin';
import { api } from '@/lib/api';
import { AlertTriangle, Save, Play, Square, Users, Video, Clock, Calendar, LogOut } from 'lucide-react';
import { JitsiRoom } from '@/components/meetings/JitsiRoom';

const typeLabels: Record<string, string> = { meeting: 'Reunião', seminar: 'Seminário', training: 'Treinamento' };
const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'danger' | 'neutral' }> = {
  scheduled: { label: 'Agendada', variant: 'info' },
  live: { label: 'Ao Vivo', variant: 'success' },
  ended: { label: 'Encerrada', variant: 'neutral' },
  cancelled: { label: 'Cancelada', variant: 'danger' },
};
const participantStatusLabels: Record<string, { label: string; color: string }> = {
  invited: { label: 'Convidado', color: 'text-white/40' },
  accepted: { label: 'Confirmado', color: 'text-green-400' },
  declined: { label: 'Recusou', color: 'text-red-400' },
  attended: { label: 'Presente', color: 'text-brand-400' },
};

export default function EditMeetingPage() {
  const params = useParams();
  const router = useRouter();
  const meetingId = params.id as string;

  const { data: session } = useSession();
  const user = session?.user as any;

  const [meeting, setMeeting] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [isInRoom, setIsInRoom] = useState(false);
  const [jitsiInfo, setJitsiInfo] = useState<{ jitsiRoomName: string } | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'meeting',
    scheduledAt: '',
    durationMinutes: 60,
  });

  const fetchMeeting = async () => {
    try {
      const data = await api.meetings.getOne(meetingId);
      setMeeting(data);
      setForm({
        title: data.title,
        description: data.description || '',
        type: data.type,
        scheduledAt: new Date(data.scheduledAt).toISOString().slice(0, 16),
        durationMinutes: data.durationMinutes,
      });
    } catch {
      setError('Reunião não encontrada');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMeeting();
  }, [meetingId]);

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    try {
      await api.meetings.update(meetingId, {
        title: form.title,
        description: form.description || undefined,
        type: form.type,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        durationMinutes: form.durationMinutes,
      });
      fetchMeeting();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStart = async () => {
    try {
      await api.meetings.start(meetingId);
      // Auto-join after starting so admin becomes Jitsi moderator
      const data = await api.meetings.join(meetingId);
      setJitsiInfo(data);
      setIsInRoom(true);
      fetchMeeting();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao iniciar');
    }
  };

  const handleEnd = async () => {
    try {
      await api.meetings.end(meetingId);
      setIsInRoom(false);
      setJitsiInfo(null);
      fetchMeeting();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao encerrar');
    }
  };

  const handleJoin = async () => {
    try {
      const data = await api.meetings.join(meetingId);
      setJitsiInfo(data);
      setIsInRoom(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao entrar');
    }
  };

  const handleLeave = async () => {
    try { await api.meetings.leave(meetingId); } catch { /* ignore */ }
    setIsInRoom(false);
    setJitsiInfo(null);
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader
          title="Carregando..."
          breadcrumbs={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Reuniões', href: '/admin/meetings' },
            { label: '...' },
          ]}
        />
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-white/[0.04] rounded-xl skeleton-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="text-center py-20">
        <Video className="w-12 h-12 text-white/20 mx-auto mb-4" />
        <p className="text-white/50 text-lg">Reunião não encontrada</p>
      </div>
    );
  }

  const s = statusMap[meeting.status] || { label: meeting.status, variant: 'neutral' as const };
  const isEditable = meeting.status === 'scheduled';

  // Jitsi fullscreen
  if (isInRoom && jitsiInfo) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 bg-surface-dark border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <Video className="w-5 h-5 text-green-400" />
            <span className="text-white font-medium text-sm">{meeting.title}</span>
            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] font-bold rounded-full uppercase">
              Ao Vivo
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleEnd}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors"
            >
              <Square className="w-4 h-4" />
              Encerrar
            </button>
            <button
              onClick={handleLeave}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
        <div className="flex-1">
          <JitsiRoom
            roomName={jitsiInfo.jitsiRoomName}
            displayName={user?.name || 'Admin'}
            email={user?.email}
            onLeave={handleLeave}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={meeting.title}
        description={`${s.label} · ${typeLabels[meeting.type]}`}
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Reuniões', href: '/admin/meetings' },
          { label: meeting.title },
        ]}
      />

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="glass rounded-xl p-4 border border-white/[0.06]">
              <Calendar className="w-5 h-5 text-white/30 mb-2" />
              <p className="text-sm text-white/50">Data</p>
              <p className="text-white font-medium">
                {new Date(meeting.scheduledAt).toLocaleDateString('pt-BR')}
              </p>
              <p className="text-xs text-white/40">
                {new Date(meeting.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="glass rounded-xl p-4 border border-white/[0.06]">
              <Clock className="w-5 h-5 text-white/30 mb-2" />
              <p className="text-sm text-white/50">Duração</p>
              <p className="text-white font-medium">{meeting.durationMinutes} min</p>
            </div>
            <div className="glass rounded-xl p-4 border border-white/[0.06]">
              <Users className="w-5 h-5 text-white/30 mb-2" />
              <p className="text-sm text-white/50">Participantes</p>
              <p className="text-white font-medium">{meeting.participants?.length || 0}</p>
            </div>
          </div>

          {/* Edit form */}
          {isEditable && (
            <div className="glass rounded-xl p-6 border border-white/[0.06] space-y-4">
              <h3 className="text-lg font-display font-semibold">Editar Reunião</h3>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">Título</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/[0.06] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:border-brand-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">Descrição</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white/[0.06] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:border-brand-500/50 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">Tipo</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/[0.06] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:border-brand-500/50"
                  >
                    <option value="meeting">Reunião</option>
                    <option value="seminar">Seminário</option>
                    <option value="training">Treinamento</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">Data/Hora</label>
                  <input
                    type="datetime-local"
                    value={form.scheduledAt}
                    onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/[0.06] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:border-brand-500/50"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-xl font-medium text-sm hover:bg-brand-600 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            {meeting.status === 'scheduled' && (
              <button
                onClick={handleStart}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl font-medium text-sm hover:bg-green-700 transition-colors"
              >
                <Play className="w-4 h-4" />
                Iniciar Reunião
              </button>
            )}
            {meeting.status === 'live' && (
              <>
                <button
                  onClick={handleJoin}
                  className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl font-medium text-sm hover:bg-green-700 transition-colors"
                >
                  <Video className="w-4 h-4" />
                  Entrar na Reunião
                </button>
                <button
                  onClick={handleEnd}
                  className="flex items-center gap-2 px-5 py-2.5 bg-yellow-600 text-white rounded-xl font-medium text-sm hover:bg-yellow-700 transition-colors"
                >
                  <Square className="w-4 h-4" />
                  Encerrar Reunião
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right: Participants */}
        <div className="glass rounded-xl border border-white/[0.06] overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.06]">
            <h3 className="text-sm font-display font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-white/40" />
              Participantes ({meeting.participants?.length || 0})
            </h3>
          </div>
          <div className="max-h-[500px] overflow-y-auto divide-y divide-white/[0.04]">
            {meeting.participants?.map((p: any) => {
              const ps = participantStatusLabels[p.status] || { label: p.status, color: 'text-white/40' };
              return (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500/60 to-brand-700/60 flex items-center justify-center shrink-0">
                    <span className="text-white font-display font-semibold text-xs">
                      {p.user.name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{p.user.name}</p>
                    <p className="text-xs text-white/30 truncate">{p.user.email}</p>
                  </div>
                  <span className={`text-xs font-medium ${ps.color}`}>{ps.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
