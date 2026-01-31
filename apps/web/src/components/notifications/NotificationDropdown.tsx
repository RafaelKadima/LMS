'use client';

import { useRouter } from 'next/navigation';
import { useNotifications } from '@/hooks/useNotifications';
import { Video, Bell, Calendar, XCircle, Settings, CheckCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const typeConfig: Record<string, { icon: typeof Bell; color: string }> = {
  meeting_invite: { icon: Calendar, color: 'text-blue-400' },
  meeting_reminder: { icon: Bell, color: 'text-yellow-400' },
  meeting_started: { icon: Video, color: 'text-green-400' },
  meeting_cancelled: { icon: XCircle, color: 'text-red-400' },
  system: { icon: Settings, color: 'text-white/50' },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function NotificationDropdown() {
  const router = useRouter();
  const { notifications, isLoading, unreadCount, markRead, markAllRead, closeDropdown } = useNotifications();

  const handleClick = (notification: any) => {
    if (!notification.isRead) {
      markRead(notification.id);
    }
    if (notification.data?.meetingId) {
      router.push(`/meetings/${notification.data.meetingId}`);
    }
    closeDropdown();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.15 }}
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-surface-card border border-white/[0.08] rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <h3 className="text-sm font-display font-semibold text-white">Notificações</h3>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 transition-colors font-body"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Marcar todas como lidas
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-9 h-9 rounded-lg skeleton-shimmer shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-3/4 rounded skeleton-shimmer" />
                  <div className="h-3 w-1/2 rounded skeleton-shimmer" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-10 text-center">
            <Bell className="w-8 h-8 text-white/15 mx-auto mb-2" />
            <p className="text-sm text-white/30 font-body">Nenhuma notificação</p>
          </div>
        ) : (
          notifications.map((n) => {
            const config = typeConfig[n.type] || typeConfig.system;
            const Icon = config.icon;
            return (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors text-left ${
                  !n.isRead ? 'bg-white/[0.02]' : ''
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-white/[0.06] ${config.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-body leading-snug ${!n.isRead ? 'text-white font-medium' : 'text-white/60'}`}>
                    {n.title}
                  </p>
                  <p className="text-xs text-white/30 mt-0.5 line-clamp-2 font-body">{n.message}</p>
                  <span className="text-[10px] text-white/20 mt-1 block font-body">{timeAgo(n.createdAt)}</span>
                </div>
                {!n.isRead && (
                  <div className="w-2 h-2 bg-brand-500 rounded-full mt-1.5 shrink-0" />
                )}
              </button>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
