'use client';

import { signOut } from 'next-auth/react';
import { Search, User, LogOut, Menu, X } from 'lucide-react';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSidebar } from '@/hooks/useSidebar';
import { useIsMobile } from '@/hooks/useMediaQuery';

interface HeaderProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
}

export function Header({ user }: HeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const { isCollapsed, setMobileOpen } = useSidebar();
  const isMobile = useIsMobile();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showDropdown]);

  return (
    <header
      className="fixed top-0 right-0 z-30 glass-strong transition-all duration-300 border-b border-white/[0.04]"
      style={{
        left: isMobile ? 0 : isCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
      }}
    >
      <div className="h-16 flex items-center justify-between px-4 md:px-6">
        {/* Left: Hamburger (mobile) + Search */}
        <div className="flex items-center gap-3 flex-1">
          {/* Hamburger button - mobile only */}
          {isMobile && (
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 -ml-2 text-white/50 hover:text-white transition-colors rounded-lg hover:bg-white/[0.04]"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Search - hidden on mobile, shown on tablet+ */}
          <div className="hidden md:block flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar cursos, aulas..."
                className="w-full pl-10 pr-4 py-2 bg-white/[0.04] border border-white/[0.06] rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-brand-500/50 focus:border-brand-500/30 transition-all"
              />
            </div>
          </div>

          {/* Search icon - mobile only */}
          {isMobile && (
            <button
              onClick={() => setShowMobileSearch(!showMobileSearch)}
              className="p-2 text-white/50 hover:text-white transition-colors rounded-lg"
            >
              <Search className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <NotificationBell />

          {/* User menu */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2.5 p-1.5 text-white/50 hover:text-white transition-colors rounded-xl hover:bg-white/[0.04]"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500/80 to-brand-700/80 flex items-center justify-center ring-1 ring-white/[0.08]">
                <span className="text-white font-display font-semibold text-xs">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <span className="text-sm font-medium hidden lg:block">{user?.name || 'Usuário'}</span>
            </button>

            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                  className="absolute right-0 mt-2 w-52 bg-surface-elevated border border-white/[0.08] rounded-xl shadow-elevated overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-white/[0.06]">
                    <p className="text-sm font-medium text-white">{user?.name}</p>
                    <p className="text-xs text-white/40 mt-0.5">{user?.email}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/profile"
                      onClick={() => setShowDropdown(false)}
                      className="block px-4 py-2 text-sm text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors"
                    >
                      Meu Perfil
                    </Link>
                    <button
                      onClick={() => signOut({ callbackUrl: '/login' })}
                      className="w-full px-4 py-2 text-sm text-left text-red-400/70 hover:text-red-400 hover:bg-red-500/[0.04] transition-colors flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sair
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mobile search overlay */}
      <AnimatePresence>
        {showMobileSearch && isMobile && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-white/[0.04] overflow-hidden"
          >
            <div className="p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar cursos, aulas..."
                  autoFocus
                  className="w-full pl-10 pr-10 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-brand-500/50 transition-all"
                />
                <button
                  onClick={() => setShowMobileSearch(false)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
