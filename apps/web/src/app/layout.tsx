import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, DM_Sans } from 'next/font/google';
import '@/styles/globals.css';
import { Providers } from './providers';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Universidade MotoChefe',
  description: 'Plataforma de aprendizado corporativo MotoChefe',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${jakarta.variable} ${dmSans.variable} font-body antialiased bg-surface-dark text-white`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
