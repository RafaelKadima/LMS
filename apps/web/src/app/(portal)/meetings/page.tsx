'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Video } from 'lucide-react';
import { useState } from 'react';
import { MeetingCard } from '@/components/meetings/MeetingCard';
import { motion } from 'framer-motion';

export default function MeetingsPage() {
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const queryClient = useQueryClient();

  const { data: meetings, isLoading } = useQuery({
    queryKey: ['meetings', tab],
    queryFn: () => api.meetings.getAll(tab),
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, response }: { id: string; response: 'accepted' | 'declined' }) =>
      api.meetings.respond(id, response),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
    },
  });

  const handleRespond = (id: string, response: 'accepted' | 'declined') => {
    respondMutation.mutate({ id, response });
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-white">Reuniões</h1>
        <p className="text-white/40 text-sm font-body mt-1">
          Suas reuniões, seminários e treinamentos
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white/[0.04] rounded-xl p-1 w-fit">
        {(['upcoming', 'past'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t
                ? 'bg-white/[0.1] text-white'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            {t === 'upcoming' ? 'Próximas' : 'Anteriores'}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-white/[0.04] rounded-xl skeleton-shimmer" />
          ))}
        </div>
      ) : !meetings?.length ? (
        <div className="text-center py-16">
          <Video className="w-12 h-12 text-white/15 mx-auto mb-3" />
          <p className="text-white/40 font-body">
            {tab === 'upcoming'
              ? 'Nenhuma reunião agendada'
              : 'Nenhuma reunião anterior'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {meetings.map((meeting: any, i: number) => (
            <motion.div
              key={meeting.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.04 }}
            >
              <MeetingCard meeting={meeting} onRespond={handleRespond} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
