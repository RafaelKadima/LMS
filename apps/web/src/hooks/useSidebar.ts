import { create } from 'zustand';

interface SidebarState {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  setCollapsed: (v: boolean) => void;
  setMobileOpen: (v: boolean) => void;
  toggle: () => void;
  closeMobile: () => void;
}

export const useSidebar = create<SidebarState>((set) => ({
  isCollapsed: false,
  isMobileOpen: false,
  setCollapsed: (v) => set({ isCollapsed: v }),
  setMobileOpen: (v) => set({ isMobileOpen: v }),
  toggle: () => set((s) => ({ isCollapsed: !s.isCollapsed })),
  closeMobile: () => set({ isMobileOpen: false }),
}));
