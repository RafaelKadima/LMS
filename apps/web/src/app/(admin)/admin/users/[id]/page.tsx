'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Save, ArrowLeft, Loader2, Info } from 'lucide-react';
import { PageHeader } from '@/components/admin';
import { api } from '@/lib/api';

interface UserForm {
  email: string;
  name: string;
  password?: string;
  franchiseId: string;
  storeId: string;
  cargo: string;
  role: string;
  isActive: boolean;
}

// Configuração de campos por role
const ROLE_CONFIG = {
  super_admin: {
    label: 'Administrador da Matriz',
    description: 'Acesso total ao sistema. Gerencia todas as franquias e configurações.',
    showFranchise: false,
    showStore: false,
    showCargo: false,
  },
  franchise_admin: {
    label: 'Administrador de Franquia',
    description: 'Gerencia uma franquia específica e seus colaboradores.',
    showFranchise: true,
    showStore: false,
    showCargo: true, // Opcional - pode fazer cursos
  },
  store_manager: {
    label: 'Gerente de Loja',
    description: 'Gerencia uma loja e acompanha o progresso dos colaboradores.',
    showFranchise: true,
    showStore: true,
    showCargo: true,
  },
  learner: {
    label: 'Colaborador',
    description: 'Acessa cursos e treinamentos da plataforma.',
    showFranchise: true,
    showStore: true, // Opcional
    showCargo: true,
  },
};

export default function UserFormPage() {
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === 'new';
  const userId = isNew ? null : params.id as string;

  const [form, setForm] = useState<UserForm>({
    email: '',
    name: '',
    password: '',
    franchiseId: '',
    storeId: '',
    cargo: 'mecanico',
    role: 'learner',
    isActive: true,
  });
  const [franchises, setFranchises] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [franchisesRes, storesRes] = await Promise.all([
          api.admin.getFranchises({ perPage: 100 }),
          api.admin.getStores({ perPage: 100 }),
        ]);
        setFranchises(franchisesRes.data || []);
        setStores(storesRes.data || []);

        if (userId) {
          const user = await api.admin.getUser(userId);
          setForm({
            email: user.email,
            name: user.name,
            password: '',
            franchiseId: user.franchiseId || '',
            storeId: user.storeId || '',
            cargo: user.cargo,
            role: user.role,
            isActive: user.isActive,
          });
        }
      } catch (err) {
        setError('Erro ao carregar dados');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const config = ROLE_CONFIG[form.role as keyof typeof ROLE_CONFIG];

      const payload: any = {
        email: form.email,
        name: form.name,
        role: form.role,
      };

      // Adiciona campos apenas se necessários para o role
      if (config.showFranchise && form.franchiseId) {
        payload.franchiseId = form.franchiseId;
      }
      if (config.showStore && form.storeId) {
        payload.storeId = form.storeId;
      }
      if (config.showCargo && form.cargo) {
        payload.cargo = form.cargo;
      }

      if (isNew) {
        payload.password = form.password;
        await api.admin.createUser(payload);
      } else {
        // isActive só é enviado na atualização
        payload.isActive = form.isActive;
        await api.admin.updateUser(userId!, payload);
      }
      router.push('/admin/users');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredStores = form.franchiseId
    ? stores.filter((s) => s.franchiseId === form.franchiseId)
    : stores;

  // Configuração do role atual
  const currentRoleConfig = ROLE_CONFIG[form.role as keyof typeof ROLE_CONFIG] || ROLE_CONFIG.learner;

  // Handler para mudança de role - limpa campos dependentes
  const handleRoleChange = (newRole: string) => {
    const config = ROLE_CONFIG[newRole as keyof typeof ROLE_CONFIG];
    setForm({
      ...form,
      role: newRole,
      // Limpa franquia se o novo role não precisa
      franchiseId: config.showFranchise ? form.franchiseId : '',
      // Limpa loja se o novo role não precisa
      storeId: config.showStore ? form.storeId : '',
      // Limpa cargo se o novo role não precisa
      cargo: config.showCargo ? form.cargo : '',
    });
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
        title={isNew ? 'Novo Usuário' : 'Editar Usuário'}
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Usuários', href: '/admin/users' },
          { label: isNew ? 'Novo' : 'Editar' },
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

          {/* Tipo de Usuário (Role) - Primeiro campo para controlar visibilidade */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de Usuário *</label>
            <select
              value={form.role}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface-dark border border-gray-700 rounded-lg text-white focus:outline-none focus:border-brand-500"
            >
              <option value="learner">{ROLE_CONFIG.learner.label}</option>
              <option value="store_manager">{ROLE_CONFIG.store_manager.label}</option>
              <option value="franchise_admin">{ROLE_CONFIG.franchise_admin.label}</option>
              <option value="super_admin">{ROLE_CONFIG.super_admin.label}</option>
            </select>
            <div className="mt-2 flex items-start gap-2 text-sm text-gray-500">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{currentRoleConfig.description}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nome *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full px-4 py-2.5 bg-surface-dark border border-gray-700 rounded-lg text-white focus:outline-none focus:border-brand-500"
                placeholder="João Silva"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="w-full px-4 py-2.5 bg-surface-dark border border-gray-700 rounded-lg text-white focus:outline-none focus:border-brand-500"
                placeholder="joao@empresa.com"
              />
            </div>
          </div>

          {isNew && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Senha *</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
                className="w-full px-4 py-2.5 bg-surface-dark border border-gray-700 rounded-lg text-white focus:outline-none focus:border-brand-500"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
          )}

          {/* Franquia - visível para todos exceto super_admin */}
          {currentRoleConfig.showFranchise && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Franquia {form.role !== 'learner' ? '*' : ''}
                </label>
                <select
                  value={form.franchiseId}
                  onChange={(e) => setForm({ ...form, franchiseId: e.target.value, storeId: '' })}
                  required={form.role !== 'learner'}
                  className="w-full px-4 py-2.5 bg-surface-dark border border-gray-700 rounded-lg text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="">Selecione...</option>
                  {franchises.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              {/* Loja - visível para store_manager e learner */}
              {currentRoleConfig.showStore && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Loja {form.role === 'store_manager' ? '*' : '(opcional)'}
                  </label>
                  <select
                    value={form.storeId}
                    onChange={(e) => setForm({ ...form, storeId: e.target.value })}
                    disabled={!form.franchiseId}
                    required={form.role === 'store_manager'}
                    className="w-full px-4 py-2.5 bg-surface-dark border border-gray-700 rounded-lg text-white focus:outline-none focus:border-brand-500 disabled:opacity-50"
                  >
                    <option value="">Selecione...</option>
                    {filteredStores.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  {!form.franchiseId && (
                    <p className="mt-1 text-xs text-gray-500">Selecione uma franquia primeiro</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Cargo - visível para todos exceto super_admin */}
          {currentRoleConfig.showCargo && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Cargo {['store_manager', 'learner'].includes(form.role) ? '*' : '(opcional)'}
              </label>
              <select
                value={form.cargo}
                onChange={(e) => setForm({ ...form, cargo: e.target.value })}
                required={['store_manager', 'learner'].includes(form.role)}
                className="w-full px-4 py-2.5 bg-surface-dark border border-gray-700 rounded-lg text-white focus:outline-none focus:border-brand-500"
              >
                {!['store_manager', 'learner'].includes(form.role) && (
                  <option value="">Nenhum</option>
                )}
                <option value="mecanico">Mecânico</option>
                <option value="atendente">Atendente</option>
                <option value="gerente">Gerente</option>
                <option value="proprietario">Proprietário</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                O cargo determina quais cursos estarão disponíveis para o usuário
              </p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="w-4 h-4 rounded border-gray-700 bg-surface-dark text-brand-500"
            />
            <label htmlFor="isActive" className="text-sm text-gray-300">Usuário ativo</label>
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
