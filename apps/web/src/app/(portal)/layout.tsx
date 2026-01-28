'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';

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

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-dark">
      <Header user={session?.user} />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 p-6 ml-64">{children}</main>
      </div>
    </div>
  );
}
