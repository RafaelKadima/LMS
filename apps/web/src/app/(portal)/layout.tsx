'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { PortalHeader } from '@/components/layout/PortalHeader';
import { PageTransition } from '@/components/ui';
import { useScrollToTop } from '@/hooks/useScrollToTop';

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/login');
    },
  });

  useScrollToTop();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-dark">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-glow">
            <span className="text-white font-display font-bold text-sm">MC</span>
          </div>
          <div className="w-6 h-6 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-dark">
      <PortalHeader user={session?.user} />
      <main className="min-h-screen pt-[68px]">
        <div className="p-4 md:p-6 lg:p-8">
          <PageTransition>
            {children}
          </PageTransition>
        </div>
      </main>
    </div>
  );
}
