import { create } from 'zustand';
import { api } from '@/lib/api';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsState {
  unreadCount: number;
  notifications: Notification[];
  isDropdownOpen: boolean;
  isLoading: boolean;
  fetchUnreadCount: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  toggleDropdown: () => void;
  closeDropdown: () => void;
}

export const useNotifications = create<NotificationsState>((set, get) => ({
  unreadCount: 0,
  notifications: [],
  isDropdownOpen: false,
  isLoading: false,

  fetchUnreadCount: async () => {
    try {
      const result = await api.notifications.getUnreadCount();
      set({ unreadCount: result.count });
    } catch {
      // silently fail
    }
  },

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const result = await api.notifications.getAll({ perPage: 15 });
      set({ notifications: result.data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  markRead: async (id: string) => {
    try {
      await api.notifications.markRead(id);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n,
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch {
      // silently fail
    }
  },

  markAllRead: async () => {
    try {
      await api.notifications.markAllRead();
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch {
      // silently fail
    }
  },

  toggleDropdown: () => {
    const isOpen = !get().isDropdownOpen;
    set({ isDropdownOpen: isOpen });
    if (isOpen) {
      get().fetchNotifications();
    }
  },

  closeDropdown: () => set({ isDropdownOpen: false }),
}));
