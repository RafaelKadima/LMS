'use client';

import { signOut } from 'next-auth/react';
import { Search, LogOut, User, X, Menu } from 'lucide-react';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { href: '/catalog', label: 'Início' },
  { href: '/tracks', label: 'Trilhas' },
  { href: '/materials', label: 'Materiais' },
  { href: '/meetings', label: 'Reuniões' },
  { href: '/profile', label: 'Meu Progresso' },
  { href: '/achievements', label: 'Conquistas' },
];

interface PortalHeaderProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
}

export function PortalHeader({ user }: PortalHeaderProps) {
  const pathname = usePathname();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Detect scroll to change header background
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showDropdown]);

  // Close mobile menu on route change
  useEffect(() => {
    setShowMobileMenu(false);
  }, [pathname]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-surface-dark/95 backdrop-blur-xl shadow-lg'
            : 'bg-gradient-to-b from-surface-dark/80 to-transparent'
        }`}
      >
        <div className="h-[68px] flex items-center justify-between px-4 md:px-8 lg:px-12">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-6 lg:gap-8">
            {/* Logo */}
            <Link href="/catalog" className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-glow">
                <span className="text-white font-display font-bold text-xs">MC</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-[11px] text-white/40 font-body leading-none block">Universidade</span>
                <span className="text-sm font-display font-semibold text-white leading-tight block">MotoChefe</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors ${
                      isActive
                        ? 'text-white'
                        : 'text-white/50 hover:text-white/80'
                    }`}
                  >
                    {item.label}
                    {isActive && (
                      <motion.div
                        layoutId="portal-nav-active"
                        className="absolute -bottom-0.5 left-3 right-3 h-[2px] bg-brand-500 rounded-full"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: Search + User */}
          <div className="flex items-center gap-2">
            {/* Search - desktop */}
            <div className="hidden lg:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="w-48 xl:w-60 pl-9 pr-4 py-2 bg-white/[0.05] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:w-72 focus:ring-1 focus:ring-brand-500/40 focus:border-brand-500/30 focus:bg-white/[0.08] transition-all duration-300"
                />
              </div>
            </div>

            {/* Search icon - tablet/mobile */}
            <button
              onClick={() => setShowMobileSearch(!showMobileSearch)}
              className="lg:hidden p-2 text-white/50 hover:text-white transition-colors rounded-lg"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Notifications */}
            <NotificationBell />

            {/* User avatar + dropdown */}
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-white/[0.04] transition-colors"
              >
                <div className="w-8 h-8 rounded bg-gradient-to-br from-brand-500/80 to-brand-700/80 flex items-center justify-center ring-1 ring-white/[0.08]">
                  <span className="text-white font-display font-semibold text-xs">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
              </button>

              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
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

            {/* Mobile hamburger */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 text-white/50 hover:text-white transition-colors rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile search overlay */}
        <AnimatePresence>
          {showMobileSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden border-t border-white/[0.04] overflow-hidden bg-surface-dark/95 backdrop-blur-xl"
            >
              <div className="p-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar cursos, aulas..."
                    autoFocus
                    className="w-full pl-10 pr-10 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-brand-500/50 transition-all"
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

      {/* Mobile nav overlay */}
      <AnimatePresence>
        {showMobileMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setShowMobileMenu(false)}
            />
            <motion.nav
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="fixed top-0 right-0 bottom-0 w-64 bg-surface-card border-l border-white/[0.06] z-50 flex flex-col"
            >
              <div className="h-[68px] flex items-center justify-between px-4 border-b border-white/[0.06]">
                <span className="text-sm font-display font-semibold">Menu</span>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-1.5 text-white/40 hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 py-4 px-3 space-y-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-brand-500/10 text-brand-500'
                          : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
