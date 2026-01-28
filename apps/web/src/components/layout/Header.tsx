'use client';

import { signOut } from 'next-auth/react';
import { Bell, Search, User, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface HeaderProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
}

export function Header({ user }: HeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="fixed top-0 left-64 right-0 z-40 bg-surface-dark/95 backdrop-blur border-b border-gray-800">
      <div className="h-16 flex items-center justify-between px-6">
        {/* Search */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar cursos, aulas..."
              className="w-full pl-10 pr-4 py-2 bg-surface-card border border-gray-700 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="p-2 text-gray-400 hover:text-white transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-brand-500 rounded-full"></span>
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 p-2 text-gray-400 hover:text-white transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm hidden md:block">{user?.name || 'Usuário'}</span>
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-surface-card border border-gray-700 rounded-lg shadow-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-700">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-gray-400">{user?.email}</p>
                </div>
                <Link
                  href="/profile"
                  className="block px-4 py-2 text-sm hover:bg-surface-hover transition-colors"
                >
                  Meu Perfil
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="w-full px-4 py-2 text-sm text-left text-red-400 hover:bg-surface-hover transition-colors flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
