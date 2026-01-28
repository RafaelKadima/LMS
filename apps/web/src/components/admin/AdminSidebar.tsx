'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
} from 'lucide-react';

const menuItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Usuários', icon: Users },
  { href: '/admin/franchises', label: 'Franquias', icon: Building2 },
  { href: '/admin/stores', label: 'Lojas', icon: Store },
  { href: '/admin/courses', label: 'Cursos', icon: BookOpen },
  { href: '/admin/badges', label: 'Badges', icon: Award },
  { href: '/admin/tracks', label: 'Trilhas', icon: Route },
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

export function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user as any;

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-surface-card border-r border-gray-800 flex flex-col z-40">
      {/* Logo / Header */}
      <div className="h-16 flex items-center px-6 border-b border-gray-800">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">MC</span>
          </div>
          <div>
            <span className="text-white font-semibold">MotoChefe</span>
            <span className="text-gray-500 text-xs block -mt-1">Admin</span>
          </div>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Gestão
        </p>
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? 'bg-brand-500/10 text-brand-500 border-l-2 border-brand-500 -ml-[2px]'
                  : 'text-gray-400 hover:text-white hover:bg-surface-hover'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-gray-800 space-y-2">
        {/* Back to Portal */}
        <Link
          href="/catalog"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-gray-500 hover:text-white hover:bg-surface-hover"
        >
          <ChevronLeft className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">Voltar ao Portal</span>
        </Link>

        {/* User Info */}
        {user && (
          <div className="mt-4 pt-4 border-t border-gray-800">
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 bg-brand-500/20 rounded-full flex items-center justify-center text-brand-500 font-semibold">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{roleLabels[user.role] || user.role}</p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full mt-3 flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-gray-400 hover:text-red-500 hover:bg-red-500/10"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Sair</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
