'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/admin';
import { api } from '@/lib/api';

interface StoreForm {
  name: string;
  franchiseId: string;
  address: string;
  city: string;
  state: string;
  isActive: boolean;
}

export default function StoreFormPage() {
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === 'new';
  const storeId = isNew ? null : params.id as string;

  const [form, setForm] = useState<StoreForm>({
    name: '',
    franchiseId: '',
    address: '',
    city: '',
    state: '',
    isActive: true,
  });
  const [franchises, setFranchises] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const franchisesRes = await api.admin.getFranchises({ perPage: 100 });
        setFranchises(franchisesRes.data || []);

        if (storeId) {
          const store = await api.admin.getStore(storeId);
          setForm({
            name: store.name,
            franchiseId: store.franchiseId || '',
            address: store.address || '',
            city: store.city || '',
            state: store.state || '',
            isActive: store.isActive,
          });
        }
      } catch (err) {
        setError('Erro ao carregar dados');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [storeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const payload = {
        name: form.name,
        franchiseId: form.franchiseId,
        address: form.address || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        isActive: form.isActive,
      };

      if (isNew) {
        await api.admin.createStore(payload);
      } else {
        await api.admin.updateStore(storeId!, payload);
      }
      router.push('/admin/stores');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao salvar loja');
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
        title={isNew ? 'Nova Loja' : 'Editar Loja'}
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Lojas', href: '/admin/stores' },
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nome *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full px-4 py-2.5 bg-surface-dark border border-gray-700 rounded-lg text-white focus:outline-none focus:border-brand-500"
                placeholder="Loja Centro"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Franquia *</label>
              <select
                value={form.franchiseId}
                onChange={(e) => setForm({ ...form, franchiseId: e.target.value })}
                required
                className="w-full px-4 py-2.5 bg-surface-dark border border-gray-700 rounded-lg text-white focus:outline-none focus:border-brand-500"
              >
                <option value="">Selecione...</option>
                {franchises.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Endereço</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-4 py-2.5 bg-surface-dark border border-gray-700 rounded-lg text-white focus:outline-none focus:border-brand-500"
              placeholder="Av. Paulista, 1000"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Cidade</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full px-4 py-2.5 bg-surface-dark border border-gray-700 rounded-lg text-white focus:outline-none focus:border-brand-500"
                placeholder="São Paulo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Estado</label>
              <input
                type="text"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                maxLength={2}
                className="w-full px-4 py-2.5 bg-surface-dark border border-gray-700 rounded-lg text-white focus:outline-none focus:border-brand-500"
                placeholder="SP"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="w-4 h-4 rounded border-gray-700 bg-surface-dark text-brand-500"
            />
            <label htmlFor="isActive" className="text-sm text-gray-300">Loja ativa</label>
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
