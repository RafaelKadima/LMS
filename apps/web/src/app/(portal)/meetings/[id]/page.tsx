'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { api } from '@/lib/api';
import { useState } from 'react';
import { ArrowLeft, Video, Calendar, Clock, Users, Check, X, LogOut } from 'lucide-react';
import { JitsiRoom } from '@/components/meetings/JitsiRoom';
import { motion } from 'framer-motion';

const typeConfig: Record<string, { label: string; color: string }> = {
  meeting: { label: 'Reunião', color: 'text-blue-400' },
  seminar: { label: 'Seminário', color: 'text-purple-400' },
  training: { label: 'Treinamento', color: 'text-green-400' },
};

const participantStatusLabels: Record<string, { label: string; color: string }> = {
  invited: { label: 'Convidado', color: 'text-white/40' },
  accepted: { label: 'Confirmado', color: 'text-green-400' },
  declined: { label: 'Recusou', color: 'text-red-400' },
  attended: { label: 'Presente', color: 'text-brand-400' },
};

export default function MeetingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const meetingId = params.id as string;
  const user = session?.user as any;

  const [isInRoom, setIsInRoom] = useState(false);
  const [jitsiInfo, setJitsiInfo] = useState<{ jitsiRoomName: string } | null>(null);

  const { data: meeting, isLoading } = useQuery({
    queryKey: ['meeting', meetingId],
    queryFn: () => api.meetings.getOne(meetingId),
  });

  const respondMutation = useMutation({
    mutationFn: (response: 'accepted' | 'declined') => api.meetings.respond(meetingId, response),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meeting', meetingId] }),
  });

  const joinMutation = useMutation({
    mutationFn: () => api.meetings.join(meetingId),
    onSuccess: (data) => {
      setJitsiInfo(data);
      setIsInRoom(true);
    },
  });

  const handleLeave = async () => {
    try {
      await api.meetings.leave(meetingId);
    } catch { /* ignore */ }
    setIsInRoom(false);
    setJitsiInfo(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-white/[0.04] rounded-xl skeleton-shimmer" />
        <div className="h-48 bg-white/[0.04] rounded-xl skeleton-shimmer" />
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="text-center py-20">
        <Video className="w-12 h-12 text-white/20 mx-auto mb-4" />
        <p className="text-white/50 text-lg font-body">Reunião não encontrada</p>
        <button onClick={() => router.back()} className="text-brand-500 hover:underline mt-2 text-sm">
          Voltar
        </button>
      </div>
    );
  }

  const isLive = meeting.status === 'live';
  const config = typeConfig[meeting.type] || typeConfig.meeting;
  const myParticipant = meeting.participants?.find((p: any) => p.user.id === user?.id);
  const isPending = myParticipant?.status === 'invited';
  const scheduledDate = new Date(meeting.scheduledAt);

  // Show Jitsi room fullscreen
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
          <button
            onClick={handleLeave}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
        <div className="flex-1">
          <JitsiRoom
            roomName={jitsiInfo.jitsiRoomName}
            displayName={user?.name || 'Participante'}
            email={user?.email}
            onLeave={handleLeave}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </button>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
            {isLive && (
              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] font-bold rounded-full uppercase animate-pulse">
                Ao Vivo
              </span>
            )}
            {meeting.status === 'ended' && (
              <span className="px-2 py-0.5 bg-white/[0.06] text-white/40 text-[10px] font-bold rounded-full uppercase">
                Encerrada
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">{meeting.title}</h1>
          {meeting.description && (
            <p className="text-white/40 font-body mt-2 text-sm max-w-2xl">{meeting.description}</p>
          )}
        </div>

        {/* Info row */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-white/40 mb-6">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            {scheduledDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            {scheduledDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            {' - '}
            {meeting.durationMinutes}min
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            {meeting.participants?.length || 0} participantes
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 mb-8">
          {isLive && (
            <button
              onClick={() => joinMutation.mutate()}
              disabled={joinMutation.isPending}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-display font-semibold text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Video className="w-5 h-5" />
              {joinMutation.isPending ? 'Conectando...' : 'Entrar na Reunião'}
            </button>
          )}
          {isPending && !isLive && (
            <>
              <button
                onClick={() => respondMutation.mutate('accepted')}
                disabled={respondMutation.isPending}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl font-medium text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                Aceitar
              </button>
              <button
                onClick={() => respondMutation.mutate('declined')}
                disabled={respondMutation.isPending}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.06] text-white/70 rounded-xl font-medium text-sm hover:bg-white/[0.1] transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                Recusar
              </button>
            </>
          )}
          {myParticipant?.status === 'accepted' && !isLive && meeting.status === 'scheduled' && (
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <Check className="w-4 h-4" />
              Você confirmou presença
            </div>
          )}
        </div>

        {/* Created by */}
        <div className="text-xs text-white/30 mb-6">
          Criada por {meeting.createdBy?.name}
        </div>

        {/* Participants */}
        <div className="glass rounded-xl border border-white/[0.06] overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.06]">
            <h2 className="text-sm font-display font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-white/40" />
              Participantes
            </h2>
          </div>
          <div className="divide-y divide-white/[0.04]">
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
                    <p className="text-sm font-medium text-white">{p.user.name}</p>
                  </div>
                  <span className={`text-xs font-medium ${ps.color}`}>{ps.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
