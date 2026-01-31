'use client';

import { signIn, getSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useWebAuthn } from '@/hooks/useWebAuthn';

interface Settings {
  primaryColor: string;
  secondaryColor: string;
  loginBgType: 'color' | 'image' | 'video';
  loginBgColor: string;
  loginBgMediaUrl: string | null;
  logoUrl: string | null;
}

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get('error');
  const callbackUrl = searchParams.get('callbackUrl');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const { isSupported: passkeySupported, isLoading: isPasskeyLoading, error: passkeyError, loginWithPasskey } = useWebAuthn();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await api.getPublicSettings();
        setSettings(data);
      } catch (err) {
        console.error('Erro ao carregar configurações:', err);
      }
    };
    fetchSettings();
  }, []);

  const redirectAfterLogin = async () => {
    const session = await getSession();
    const userRole = (session?.user as any)?.role;
    const isAdmin = ['super_admin', 'franchise_admin', 'store_manager'].includes(userRole);

    if (callbackUrl) {
      router.push(callbackUrl);
    } else if (isAdmin) {
      router.push('/admin/dashboard');
    } else {
      router.push('/catalog');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError(null);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setLoginError('Email ou senha incorretos');
      } else {
        await redirectAfterLogin();
      }
    } catch {
      setLoginError('Erro ao fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasskeyLogin = async () => {
    setLoginError(null);
    try {
      const userData = await loginWithPasskey();
      const result = await signIn('credentials', {
        webauthnToken: JSON.stringify(userData),
        redirect: false,
      });

      if (result?.error) {
        setLoginError('Erro ao autenticar com passkey');
      } else {
        await redirectAfterLogin();
      }
    } catch {
      // Error handled by the hook
    }
  };

  const primaryColor = settings?.primaryColor || '#f97316';
  const bgColor = settings?.loginBgType === 'color' ? (settings?.loginBgColor || '#141414') : '#141414';

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ backgroundColor: bgColor }}
    >
      {/* Radial gradient pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/[0.03] via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-brand-500/[0.05] via-transparent to-transparent" />

      {/* Background Video */}
      {settings?.loginBgType === 'video' && settings.loginBgMediaUrl && (
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={settings.loginBgMediaUrl} type="video/mp4" />
        </video>
      )}

      {/* Background Image */}
      {settings?.loginBgType === 'image' && settings.loginBgMediaUrl && (
        <img
          src={settings.loginBgMediaUrl}
          alt="Background"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Overlay para legibilidade */}
      {(settings?.loginBgType === 'image' || settings?.loginBgType === 'video') && settings?.loginBgMediaUrl && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      )}

      {/* Conteudo */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-8 p-8 sm:p-10 rounded-2xl border border-white/[0.10] animate-fade-in backdrop-blur-xl bg-black/40">
          <div className="text-center">
            {settings?.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt="Logo"
                className="h-16 mx-auto mb-4 object-contain"
              />
            ) : (
              <>
                <h2 className="font-body text-lg text-white/50 tracking-wide uppercase">
                  Universidade
                </h2>
                <h1 className="mt-1 font-display text-4xl sm:text-5xl text-accent-gold tracking-tight">
                  MotoChefe
                </h1>
              </>
            )}
            <p className="mt-6 font-body text-white/40 text-sm">
              Acesse sua conta para comecar a aprender
            </p>
          </div>

          {(error || loginError) && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm font-body">
              {loginError || 'Ocorreu um erro. Tente novamente.'}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/60 font-body mb-1.5">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors font-body"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/60 font-body mb-1.5">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors font-body"
                placeholder="Digite sua senha"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-glow text-lg font-display font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              style={{
                backgroundColor: primaryColor,
                '--tw-ring-color': primaryColor,
              } as any}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {passkeySupported && (
            <div className="space-y-3">
              <div className="relative flex items-center justify-center">
                <div className="border-t border-white/[0.08] w-full" />
                <span className="bg-transparent px-3 text-sm text-white/30 font-body absolute" style={{ backgroundColor: bgColor }}>ou</span>
              </div>

              <button
                type="button"
                onClick={handlePasskeyLogin}
                disabled={isPasskeyLoading || isLoading}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl border border-white/[0.10] text-white/80 hover:bg-white/[0.04] transition-all disabled:opacity-50 disabled:cursor-not-allowed font-body"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 11c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3z" fill="currentColor"/>
                  <path d="M9 2C5.69 2 3 4.69 3 8c0 2.17 1.17 4.06 2.91 5.09L3 22l3-1.5L9 22l3-1.5L15 22l-2.91-8.91C13.83 12.06 15 10.17 15 8c0-3.31-2.69-6-6-6zm0 2c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4z" fill="currentColor"/>
                  <path d="M16 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
                {isPasskeyLoading ? 'Autenticando...' : 'Entrar com Passkey'}
              </button>

              {passkeyError && (
                <p className="text-sm text-red-400 text-center font-body">{passkeyError}</p>
              )}
            </div>
          )}

          <p className="text-center text-sm font-body text-white/30">
            Nao tem acesso? Fale com o consultor da sua Franquia.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-dark" />}>
      <LoginForm />
    </Suspense>
  );
}
