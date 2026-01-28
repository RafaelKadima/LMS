'use client';

import { useEffect, useState } from 'react';
import { Save, Loader2, Palette, Image, Video, Monitor } from 'lucide-react';
import { PageHeader, MediaUpload } from '@/components/admin';
import { api } from '@/lib/api';

interface Settings {
  id: string;
  primaryColor: string;
  secondaryColor: string;
  loginBgType: 'color' | 'image' | 'video';
  loginBgColor: string;
  loginBgMediaUrl: string | null;
  logoUrl: string | null;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await api.admin.getSettings();
      setSettings(data);
    } catch (err) {
      setError('Erro ao carregar configurações');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await api.admin.updateSettings({
        primaryColor: settings.primaryColor,
        secondaryColor: settings.secondaryColor,
        loginBgType: settings.loginBgType,
        loginBgColor: settings.loginBgColor,
        loginBgMediaUrl: settings.loginBgMediaUrl || undefined,
        logoUrl: settings.logoUrl || undefined,
      });
      setSuccess(true);
      // Recarregar a página após 1 segundo para aplicar as novas cores
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao salvar configurações');
      setIsSaving(false);
    }
  };

  const updateSettings = (updates: Partial<Settings>) => {
    if (settings) {
      setSettings({ ...settings, ...updates });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Configurações"
        description="Personalize a aparência da plataforma"
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Configurações' },
        ]}
      />

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500 text-sm">
          Configurações salvas com sucesso!
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cores do Sistema */}
        <div className="bg-surface-card rounded-xl border border-gray-800 p-6">
          <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
            <Palette className="w-5 h-5 text-brand-500" />
            Cores do Sistema
          </h3>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Cor Primária (Marca)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings?.primaryColor || '#f97316'}
                  onChange={(e) => updateSettings({ primaryColor: e.target.value })}
                  className="w-12 h-12 rounded-lg border border-gray-700 cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={settings?.primaryColor || '#f97316'}
                  onChange={(e) => updateSettings({ primaryColor: e.target.value })}
                  className="flex-1 px-4 py-2.5 bg-surface-dark border border-gray-700 rounded-lg text-white focus:outline-none focus:border-brand-500 font-mono"
                  placeholder="#f97316"
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Usada em botões, links e elementos de destaque
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Cor Secundária (Background)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings?.secondaryColor || '#141414'}
                  onChange={(e) => updateSettings({ secondaryColor: e.target.value })}
                  className="w-12 h-12 rounded-lg border border-gray-700 cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={settings?.secondaryColor || '#141414'}
                  onChange={(e) => updateSettings({ secondaryColor: e.target.value })}
                  className="flex-1 px-4 py-2.5 bg-surface-dark border border-gray-700 rounded-lg text-white focus:outline-none focus:border-brand-500 font-mono"
                  placeholder="#141414"
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Cor de fundo principal da plataforma
              </p>
            </div>

            {/* Preview das cores */}
            <div className="p-4 rounded-lg border border-gray-700">
              <p className="text-sm text-gray-400 mb-3">Preview:</p>
              <div className="flex items-center gap-4">
                <div
                  className="w-24 h-10 rounded-lg flex items-center justify-center text-white text-sm font-medium"
                  style={{ backgroundColor: settings?.primaryColor }}
                >
                  Botão
                </div>
                <div
                  className="w-24 h-10 rounded-lg flex items-center justify-center text-gray-400 text-sm border border-gray-700"
                  style={{ backgroundColor: settings?.secondaryColor }}
                >
                  Background
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Logo */}
        <div className="bg-surface-card rounded-xl border border-gray-800 p-6">
          <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
            <Image className="w-5 h-5 text-brand-500" />
            Logo da Plataforma
          </h3>

          <MediaUpload
            value={settings?.logoUrl || undefined}
            onChange={(url) => updateSettings({ logoUrl: url })}
            mediaType="logo"
            accept="image/*"
            maxSize={10}
            description="Recomendado: PNG ou SVG com fundo transparente, 200x50px"
          />
        </div>

        {/* Background do Login */}
        <div className="bg-surface-card rounded-xl border border-gray-800 p-6 lg:col-span-2">
          <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
            <Monitor className="w-5 h-5 text-brand-500" />
            Background da Página de Login
          </h3>

          {/* Tipo de Background */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Tipo de Background
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => updateSettings({ loginBgType: 'color' })}
                className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                  settings?.loginBgType === 'color'
                    ? 'border-brand-500 bg-brand-500/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <Palette className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-300">Cor Sólida</p>
              </button>
              <button
                type="button"
                onClick={() => updateSettings({ loginBgType: 'image' })}
                className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                  settings?.loginBgType === 'image'
                    ? 'border-brand-500 bg-brand-500/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <Image className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-300">Imagem</p>
              </button>
              <button
                type="button"
                onClick={() => updateSettings({ loginBgType: 'video' })}
                className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                  settings?.loginBgType === 'video'
                    ? 'border-brand-500 bg-brand-500/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <Video className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-300">Vídeo</p>
              </button>
            </div>
          </div>

          {/* Cor de Background (se tipo = color) */}
          {settings?.loginBgType === 'color' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Cor do Background
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.loginBgColor || '#141414'}
                  onChange={(e) => updateSettings({ loginBgColor: e.target.value })}
                  className="w-12 h-12 rounded-lg border border-gray-700 cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={settings.loginBgColor || '#141414'}
                  onChange={(e) => updateSettings({ loginBgColor: e.target.value })}
                  className="w-32 px-4 py-2.5 bg-surface-dark border border-gray-700 rounded-lg text-white focus:outline-none focus:border-brand-500 font-mono"
                  placeholder="#141414"
                />
              </div>
            </div>
          )}

          {/* Upload de Mídia (se tipo = image ou video) */}
          {(settings?.loginBgType === 'image' || settings?.loginBgType === 'video') && (
            <div className="mb-6">
              <MediaUpload
                value={settings.loginBgMediaUrl || undefined}
                onChange={(url) => updateSettings({ loginBgMediaUrl: url })}
                mediaType="background"
                accept={settings.loginBgType === 'video' ? 'video/*' : 'image/*'}
                maxSize={200}
                label={settings.loginBgType === 'video' ? 'Vídeo de Background' : 'Imagem de Background'}
                description={
                  settings.loginBgType === 'video'
                    ? 'MP4 ou WebM recomendado (máx. 200MB). O vídeo será reproduzido em loop sem áudio.'
                    : 'Recomendado: 1920x1080px ou maior para melhor qualidade (máx. 200MB).'
                }
              />
            </div>
          )}

          {/* Preview do Login */}
          <div className="border border-gray-700 rounded-lg overflow-hidden">
            <p className="text-sm text-gray-400 p-3 border-b border-gray-700">
              Preview da Página de Login:
            </p>
            <div
              className="relative h-64 flex items-center justify-center"
              style={{
                backgroundColor:
                  settings?.loginBgType === 'color' ? settings.loginBgColor : '#141414',
              }}
            >
              {/* Background Media */}
              {settings?.loginBgType === 'video' && settings.loginBgMediaUrl && (
                <video
                  src={settings.loginBgMediaUrl}
                  className="absolute inset-0 w-full h-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              )}
              {settings?.loginBgType === 'image' && settings.loginBgMediaUrl && (
                <img
                  src={settings.loginBgMediaUrl}
                  alt="Background"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}

              {/* Overlay */}
              {(settings?.loginBgType === 'image' || settings?.loginBgType === 'video') &&
                settings?.loginBgMediaUrl && (
                  <div className="absolute inset-0 bg-black/50" />
                )}

              {/* Login Card Preview */}
              <div className="relative z-10 bg-surface-card/90 backdrop-blur-sm rounded-xl p-6 w-72 border border-gray-700">
                {settings?.logoUrl ? (
                  <img
                    src={settings.logoUrl}
                    alt="Logo"
                    className="h-8 mx-auto mb-4 object-contain"
                  />
                ) : (
                  <div
                    className="text-xl font-bold text-center mb-4"
                    style={{ color: settings?.primaryColor }}
                  >
                    MotoChefe
                  </div>
                )}
                <div className="space-y-3">
                  <div className="h-10 bg-surface-dark rounded-lg border border-gray-700" />
                  <div className="h-10 bg-surface-dark rounded-lg border border-gray-700" />
                  <div
                    className="h-10 rounded-lg flex items-center justify-center text-white text-sm font-medium"
                    style={{ backgroundColor: settings?.primaryColor }}
                  >
                    Entrar
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Botão Salvar */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 font-medium disabled:opacity-50 transition-colors"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {isSaving ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </div>
    </div>
  );
}
