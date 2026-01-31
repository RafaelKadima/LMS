'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Users,
  Building2,
  Store,
  BookOpen,
  Award,
  Route,
  GraduationCap,
  ChevronLeft,
  LogOut,
  Settings,
  BarChart2,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Video,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSidebar } from '@/hooks/useSidebar';
import { useIsMobile, useIsTablet, useIsDesktop } from '@/hooks/useMediaQuery';

const menuItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Usuários', icon: Users },
  { href: '/admin/franchises', label: 'Franquias', icon: Building2 },
  { href: '/admin/stores', label: 'Lojas', icon: Store },
  { href: '/admin/courses', label: 'Cursos', icon: BookOpen },
  { href: '/admin/badges', label: 'Badges', icon: Award },
  { href: '/admin/tracks', label: 'Trilhas', icon: Route },
  { href: '/admin/meetings', label: 'Reuniões', icon: Video },
  { href: '/admin/enrollments', label: 'Matrículas', icon: GraduationCap },
  { href: '/admin/reports', label: 'Relatórios', icon: BarChart2 },
  { href: '/admin/settings', label: 'Configurações', icon: Settings },
];

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  franchise_admin: 'Admin Franquia',
  store_manager: 'Gerente Loja',
  learner: 'Colaborador',
};

function AdminSidebarContent({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user as any;

  return (
    <div className="flex flex-col h-full">
      {/* Logo / Header */}
      <div className="h-16 flex items-center border-b border-white/[0.06] shrink-0 px-4">
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center shrink-0 shadow-glow">
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
                <span className="text-[15px] font-display font-semibold text-white">MotoChefe</span>
                <span className="text-[10px] text-white/30 uppercase tracking-widest block -mt-0.5 font-display">Admin</span>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {!collapsed && (
          <p className="px-3 text-[10px] font-semibold text-white/30 uppercase tracking-[0.12em] mb-3 font-display">
            Gestão
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
                    layoutId="admin-sidebar-active"
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

      {/* Bottom Section */}
      <div className="p-3 border-t border-white/[0.06] space-y-1">
        {/* Back to Portal */}
        <div className="relative group">
          <Link
            href="/catalog"
            className={`flex items-center gap-3 rounded-xl transition-all duration-200 text-white/40 hover:text-white hover:bg-white/[0.04]
              ${collapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2.5'}
            `}
          >
            <ChevronLeft className="w-[18px] h-[18px] shrink-0" />
            {!collapsed && <span className="text-sm font-medium">Voltar ao Portal</span>}
          </Link>
          {collapsed && (
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 bg-surface-elevated text-white text-xs font-medium rounded-lg shadow-elevated opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 whitespace-nowrap z-50 border border-white/[0.06]">
              Voltar ao Portal
            </div>
          )}
        </div>

        {/* User Info */}
        {user && (
          <div className={`mt-2 pt-3 border-t border-white/[0.06] ${collapsed ? 'px-0' : 'px-1'}`}>
            <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
              <div className="w-8 h-8 bg-brand-500/15 rounded-full flex items-center justify-center text-brand-500 font-display font-semibold text-sm shrink-0">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user.name}</p>
                  <p className="text-[11px] text-white/30 truncate">{roleLabels[user.role] || user.role}</p>
                </div>
              )}
            </div>
            <div className="relative group">
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className={`w-full mt-2 flex items-center gap-3 rounded-xl transition-all duration-200 text-white/30 hover:text-red-400 hover:bg-red-500/5
                  ${collapsed ? 'px-0 py-2 justify-center' : 'px-3 py-2'}
                `}
              >
                <LogOut className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="text-sm">Sair</span>}
              </button>
              {collapsed && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 bg-surface-elevated text-white text-xs font-medium rounded-lg shadow-elevated opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 whitespace-nowrap z-50 border border-white/[0.06]">
                  Sair
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminSidebar() {
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={closeMobile}
            />
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
              <AdminSidebarContent collapsed={false} />
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
      <AdminSidebarContent collapsed={isCollapsed} />

      {/* Toggle button */}
      {isDesktop && (
        <button
          onClick={() => setCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-surface-elevated border border-white/[0.08] flex items-center justify-center text-white/40 hover:text-white hover:bg-surface-hover transition-all shadow-md"
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
