'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import {
  Home,
  BookOpen,
  Route,
  Trophy,
  FolderOpen,
  Video,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSidebar } from '@/hooks/useSidebar';
import { useIsMobile, useIsTablet, useIsDesktop } from '@/hooks/useMediaQuery';

const menuItems = [
  { href: '/catalog', label: 'Catálogo', icon: Home },
  { href: '/tracks', label: 'Trilhas', icon: Route },
  { href: '/materials', label: 'Materiais', icon: FolderOpen },
  { href: '/meetings', label: 'Reuniões', icon: Video },
  { href: '/profile', label: 'Meu Progresso', icon: BookOpen },
  { href: '/achievements', label: 'Conquistas', icon: Trophy },
];

function SidebarContent({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 flex items-center border-b border-white/[0.06] shrink-0 px-4">
        <Link href="/catalog" className="flex items-center gap-3 w-full">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shrink-0 shadow-glow">
            <span className="text-white font-display font-bold text-sm">MC</span>
          </div>
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <span className="text-[13px] text-white/50 font-body">Universidade</span>
                <span className="text-[15px] font-display font-semibold text-white block -mt-0.5">MotoChefe</span>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {!collapsed && (
          <p className="px-3 text-[10px] font-semibold text-white/30 uppercase tracking-[0.12em] mb-3 font-display">
            Menu
          </p>
        )}
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <div key={item.href} className="relative group">
              <Link
                href={item.href}
                className={`flex items-center gap-3 rounded-xl transition-all duration-200 relative
                  ${collapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2.5'}
                  ${isActive
                    ? 'bg-brand-500/10 text-brand-500'
                    : 'text-white/50 hover:text-white hover:bg-white/[0.04]'
                  }
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="portal-sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-brand-500 rounded-r-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className="w-[18px] h-[18px] shrink-0" />
                <AnimatePresence mode="wait">
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.15 }}
                      className="text-sm font-medium whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>

              {/* Tooltip for collapsed mode */}
              {collapsed && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 bg-surface-elevated text-white text-xs font-medium rounded-lg shadow-elevated opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 whitespace-nowrap z-50 border border-white/[0.06]">
                  {item.label}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-3 border-t border-white/[0.06]">
        <div className="h-1 w-full rounded-full bg-white/[0.04] overflow-hidden">
          <div className="h-full w-1/3 bg-gradient-to-r from-brand-500/60 to-brand-500/20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  const { isCollapsed, isMobileOpen, setCollapsed, setMobileOpen, closeMobile } = useSidebar();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();
  const pathname = usePathname();

  // Auto-collapse on tablet, expand on desktop
  useEffect(() => {
    if (isTablet) setCollapsed(true);
    if (isDesktop) setCollapsed(false);
  }, [isTablet, isDesktop, setCollapsed]);

  // Close mobile sidebar on route change
  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  const sidebarWidth = isCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)';

  // Mobile: overlay sidebar
  if (isMobile) {
    return (
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={closeMobile}
            />
            {/* Sidebar */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="fixed left-0 top-0 bottom-0 z-50 bg-surface-card border-r border-white/[0.06]"
              style={{ width: 'var(--sidebar-width)' }}
            >
              <button
                onClick={closeMobile}
                className="absolute top-4 right-3 p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <SidebarContent collapsed={false} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    );
  }

  // Desktop & Tablet: fixed sidebar
  return (
    <motion.aside
      className="fixed left-0 top-0 bottom-0 z-40 bg-surface-card/80 backdrop-blur-xl border-r border-white/[0.06] flex flex-col"
      animate={{ width: sidebarWidth }}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
    >
      <SidebarContent collapsed={isCollapsed} />

      {/* Toggle button */}
      {isDesktop && (
        <button
          onClick={() => setCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-surface-elevated border border-white/[0.08] flex items-center justify-center text-white/40 hover:text-white hover:bg-surface-hover transition-all shadow-md opacity-0 hover:opacity-100 group-hover:opacity-100"
          style={{ opacity: 1 }}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-3.5 h-3.5" />
          ) : (
            <PanelLeftClose className="w-3.5 h-3.5" />
          )}
        </button>
      )}
    </motion.aside>
  );
}
