'use client';

import { Video, Calendar, Clock, Users, Check, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MeetingCardProps {
  meeting: any;
  onRespond?: (id: string, response: 'accepted' | 'declined') => void;
}

const typeConfig: Record<string, { label: string; color: string; bg: string }> = {
  meeting: { label: 'Reunião', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  seminar: { label: 'Seminário', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  training: { label: 'Treinamento', color: 'text-green-400', bg: 'bg-green-500/10' },
};

export function MeetingCard({ meeting, onRespond }: MeetingCardProps) {
  const router = useRouter();
  const config = typeConfig[meeting.type] || typeConfig.meeting;
  const isLive = meeting.status === 'live';
  const isPending = meeting.myStatus === 'invited';
  const scheduledDate = new Date(meeting.scheduledAt);

  return (
    <div
      onClick={() => router.push(`/meetings/${meeting.id}`)}
      className={`glass rounded-xl border transition-all cursor-pointer group ${
        isLive
          ? 'border-green-500/30 hover:border-green-500/50'
          : 'border-white/[0.06] hover:border-white/[0.12]'
      }`}
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${config.bg} ${config.color}`}>
              <Video className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-display font-semibold text-white truncate group-hover:text-brand-400 transition-colors">
                  {meeting.title}
                </h3>
                {isLive && (
                  <span className="shrink-0 px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] font-bold rounded-full uppercase tracking-wider animate-pulse">
                    Ao Vivo
                  </span>
                )}
              </div>
              <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-white/40">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {scheduledDate.toLocaleDateString('pt-BR')}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {scheduledDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            {' - '}
            {meeting.durationMinutes}min
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            {meeting._count?.participants || 0} participantes
          </span>
        </div>

        {/* RSVP or Enter */}
        <div className="flex items-center gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
          {isLive && (
            <button
              onClick={() => router.push(`/meetings/${meeting.id}`)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Video className="w-4 h-4" />
              Entrar
            </button>
          )}
          {isPending && !isLive && (
            <>
              <button
                onClick={() => onRespond?.(meeting.id, 'accepted')}
                className="px-3 py-1.5 bg-green-600/20 text-green-400 rounded-lg text-sm font-medium hover:bg-green-600/30 transition-colors flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                Aceitar
              </button>
              <button
                onClick={() => onRespond?.(meeting.id, 'declined')}
                className="px-3 py-1.5 bg-red-600/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-600/30 transition-colors flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                Recusar
              </button>
            </>
          )}
          {meeting.myStatus === 'accepted' && !isLive && (
            <span className="text-xs text-green-400 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              Confirmado
            </span>
          )}
          {meeting.myStatus === 'declined' && (
            <span className="text-xs text-red-400 flex items-center gap-1.5">
              <X className="w-3.5 h-3.5" />
              Recusado
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
