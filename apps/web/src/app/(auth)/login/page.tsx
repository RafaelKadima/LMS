'use client';

import { signIn, getSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import { api } from '@/lib/api';

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

  useEffect(() => {
    // Buscar configurações da plataforma
    const fetchSettings = async () => {
      try {
        const data = await api.getPublicSettings();
        setSettings(data);
      } catch (err) {
        // Usar valores padrão se falhar
        console.error('Erro ao carregar configurações:', err);
      }
    };
    fetchSettings();
  }, []);

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
        // Get the session to check user role
        const session = await getSession();
        const userRole = (session?.user as any)?.role;
        const isAdmin = ['super_admin', 'franchise_admin', 'store_manager'].includes(userRole);

        // Redirect based on role
        if (callbackUrl) {
          router.push(callbackUrl);
        } else if (isAdmin) {
          router.push('/admin/dashboard');
        } else {
          router.push('/catalog');
        }
      }
    } catch {
      setLoginError('Erro ao fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const primaryColor = settings?.primaryColor || '#f97316';
  const bgColor = settings?.loginBgType === 'color' ? (settings?.loginBgColor || '#141414') : '#141414';

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ backgroundColor: bgColor }}
    >
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

      {/* Overlay para legibilidade (quando há mídia de fundo) */}
      {(settings?.loginBgType === 'image' || settings?.loginBgType === 'video') && settings?.loginBgMediaUrl && (
        <div className="absolute inset-0 bg-black/50" />
      )}

      {/* Conteúdo */}
      <div className="relative z-10 min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 p-8 bg-surface-card/90 backdrop-blur-sm rounded-xl border border-gray-800 mx-4">
          <div className="text-center">
            {settings?.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt="Logo"
                className="h-16 mx-auto mb-4 object-contain"
              />
            ) : (
              <>
                <h2 className="text-2xl font-semibold text-white">Universidade</h2>
                <h1
                  className="mt-1 text-4xl font-bold"
                  style={{ color: primaryColor }}
                >
                  MotoChefe
                </h1>
              </>
            )}
            <p className="mt-4 text-gray-400">
              Acesse sua conta para comecar a aprender
            </p>
          </div>

          {(error || loginError) && (
            <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 text-red-400 text-sm">
              {loginError || 'Ocorreu um erro. Tente novamente.'}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
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
                className="mt-1 block w-full px-4 py-3 bg-surface-dark border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': primaryColor } as any}
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
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
                className="mt-1 block w-full px-4 py-3 bg-surface-dark border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': primaryColor } as any}
                placeholder="Digite sua senha"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

          <p className="text-center text-sm text-gray-500">
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
