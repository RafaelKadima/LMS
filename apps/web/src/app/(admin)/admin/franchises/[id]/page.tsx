'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/admin';
import { api } from '@/lib/api';

interface FranchiseForm {
  name: string;
  cnpj: string;
  slug: string;
  logoUrl: string;
  isActive: boolean;
}

export default function FranchiseFormPage() {
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === 'new';
  const franchiseId = isNew ? null : params.id as string;

  const [form, setForm] = useState<FranchiseForm>({
    name: '',
    cnpj: '',
    slug: '',
    logoUrl: '',
    isActive: true,
  });
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (franchiseId) {
      const fetchFranchise = async () => {
        try {
          const franchise = await api.admin.getFranchise(franchiseId);
          setForm({
            name: franchise.name,
            cnpj: franchise.cnpj,
            slug: franchise.slug,
            logoUrl: franchise.logoUrl || '',
            isActive: franchise.isActive,
          });
        } catch (err) {
          setError('Erro ao carregar franquia');
        } finally {
          setIsLoading(false);
        }
      };
      fetchFranchise();
    }
  }, [franchiseId]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name: string) => {
    setForm({
      ...form,
      name,
      slug: isNew ? generateSlug(name) : form.slug,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const payload = {
        name: form.name,
        cnpj: form.cnpj.replace(/\D/g, ''),
        slug: form.slug,
        logoUrl: form.logoUrl || undefined,
        isActive: form.isActive,
      };

      if (isNew) {
        await api.admin.createFranchise(payload);
      } else {
        await api.admin.updateFranchise(franchiseId!, payload);
      }
      router.push('/admin/franchises');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao salvar franquia');
    } finally {
      setIsSaving(false);
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
        title={isNew ? 'Nova Franquia' : 'Editar Franquia'}
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Franquias', href: '/admin/franchises' },
          { label: isNew ? 'Nova' : 'Editar' },
        ]}
      >
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2.5 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </button>
      </PageHeader>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="bg-surface-card rounded-xl border border-gray-800 p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Nome *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-surface-dark border border-gray-700 rounded-lg text-white focus:outline-none focus:border-brand-500"
              placeholder="MotoChefe Franquias"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">CNPJ *</label>
              <input
                type="text"
                value={form.cnpj}
                onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                required
                className="w-full px-4 py-2.5 bg-surface-dark border border-gray-700 rounded-lg text-white font-mono focus:outline-none focus:border-brand-500"
                placeholder="00.000.000/0000-00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Slug *</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                required
                className="w-full px-4 py-2.5 bg-surface-dark border border-gray-700 rounded-lg text-white font-mono focus:outline-none focus:border-brand-500"
                placeholder="motochefe-franquias"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">URL do Logo</label>
            <input
              type="url"
              value={form.logoUrl}
              onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
              className="w-full px-4 py-2.5 bg-surface-dark border border-gray-700 rounded-lg text-white focus:outline-none focus:border-brand-500"
              placeholder="https://..."
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="w-4 h-4 rounded border-gray-700 bg-surface-dark text-brand-500"
            />
            <label htmlFor="isActive" className="text-sm text-gray-300">Franquia ativa</label>
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-gray-800">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 font-medium disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {isSaving ? 'Salvando...' : 'Salvar'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2.5 text-gray-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
