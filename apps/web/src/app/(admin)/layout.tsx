'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { PageTransition } from '@/components/ui';
import { useSidebar } from '@/hooks/useSidebar';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { Menu } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isCollapsed, setMobileOpen } = useSidebar();
  const isMobile = useIsMobile();
  useScrollToTop();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/login');
      return;
    }

    const userRole = (session.user as any)?.role;
    const isAdmin = ['super_admin', 'franchise_admin', 'store_manager'].includes(userRole);

    if (!isAdmin) {
      router.push('/catalog');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-surface-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-glow">
            <span className="text-white font-display font-bold text-sm">MC</span>
          </div>
          <div className="w-6 h-6 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-surface-dark">
      <AdminSidebar />

      {/* Mobile header bar for hamburger */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-30 h-14 glass-strong border-b border-white/[0.04] flex items-center px-4">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 -ml-2 text-white/50 hover:text-white transition-colors rounded-lg hover:bg-white/[0.04]"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="ml-3 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
              <span className="text-white font-display font-bold text-[10px]">MC</span>
            </div>
            <span className="text-sm font-display font-semibold text-white">Admin</span>
          </div>
        </div>
      )}

      <main
        className="min-h-screen transition-all duration-300"
        style={{
          marginLeft: isMobile ? 0 : isCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
          paddingTop: isMobile ? '3.5rem' : 0,
        }}
      >
        <div className="p-4 md:p-6 lg:p-8">
          <PageTransition>
            {children}
          </PageTransition>
        </div>
      </main>
    </div>
  );
}
