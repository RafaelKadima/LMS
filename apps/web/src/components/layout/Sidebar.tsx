'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  BookOpen,
  Route,
  Trophy,
  BarChart3,
  Settings,
  Users,
} from 'lucide-react';
import { useSession } from 'next-auth/react';

const menuItems = [
  { href: '/catalog', label: 'Catálogo', icon: Home },
  { href: '/tracks', label: 'Trilhas', icon: Route },
  { href: '/profile', label: 'Meu Progresso', icon: BookOpen },
  { href: '/achievements', label: 'Conquistas', icon: Trophy },
];

const adminItems = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/admin/courses', label: 'Gerenciar Cursos', icon: BookOpen },
  { href: '/admin/users', label: 'Usuários', icon: Users },
  { href: '/admin/settings', label: 'Configurações', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Check if user has admin role (simplified check)
  const isAdmin = false; // TODO: Check session roles

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-surface-card border-r border-gray-800 z-50 flex flex-col">
      {/* Logo area - same height as header */}
      <div className="h-16 flex items-center justify-center border-b border-gray-800 shrink-0 px-6">
        <span className="text-lg text-gray-400">Universidade</span>
        <span className="text-xl font-bold text-brand-500 ml-2">MotoChefe</span>
      </div>

      <nav className="p-4 space-y-2 overflow-y-auto flex-1">
        <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Menu
        </p>
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-brand-500/10 text-brand-500'
                  : 'text-gray-400 hover:text-white hover:bg-surface-hover'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className="my-4 border-t border-gray-700" />
            <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Admin
            </p>
            {adminItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-brand-500/10 text-brand-500'
                      : 'text-gray-400 hover:text-white hover:bg-surface-hover'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </>
        )}
      </nav>
    </aside>
  );
}
