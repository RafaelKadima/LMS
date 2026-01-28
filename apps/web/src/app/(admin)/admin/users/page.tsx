'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Key, X, Eye, EyeOff, Loader2 } from 'lucide-react';
import { PageHeader, DataTable, StatusBadge, ConfirmModal, Column } from '@/components/admin';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  cargo: string;
  role: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
  franchise?: { id: string; name: string };
  store?: { id: string; name: string };
  enrollmentsCount?: number;
  badgesCount?: number;
}

interface UsersResponse {
  data: User[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  franchise_admin: 'Admin Franquia',
  store_manager: 'Gerente Loja',
  learner: 'Colaborador',
};

const cargoLabels: Record<string, string> = {
  mecanico: 'Mecânico',
  atendente: 'Atendente',
  gerente: 'Gerente',
  proprietario: 'Proprietário',
};

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, perPage: 20, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; user?: User }>({ isOpen: false });
  const [isDeleting, setIsDeleting] = useState(false);
  const [passwordModal, setPasswordModal] = useState<{ isOpen: boolean; user?: User }>({ isOpen: false });
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const fetchUsers = async (page = 1) => {
    setIsLoading(true);
    try {
      const response: UsersResponse = await api.admin.getUsers({ page, perPage: 20 });
      setUsers(response.data);
      setMeta(response.meta);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async () => {
    if (!deleteModal.user) return;
    setIsDeleting(true);
    try {
      await api.admin.deleteUser(deleteModal.user.id);
      setDeleteModal({ isOpen: false });
      fetchUsers(meta.page);
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const openPasswordModal = (user: User) => {
    setPasswordModal({ isOpen: true, user });
    setNewPassword('');
    setShowPassword(false);
    setPasswordError(null);
  };

  const closePasswordModal = () => {
    setPasswordModal({ isOpen: false });
    setNewPassword('');
    setShowPassword(false);
    setPasswordError(null);
  };

  const handleResetPassword = async () => {
    if (!passwordModal.user) return;

    if (newPassword.length < 6) {
      setPasswordError('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    setIsResetting(true);
    setPasswordError(null);

    try {
      await api.admin.resetPassword(passwordModal.user.id, { newPassword });
      closePasswordModal();
      // Opcional: mostrar toast de sucesso
    } catch (error: any) {
      setPasswordError(error.response?.data?.message || 'Erro ao alterar senha');
    } finally {
      setIsResetting(false);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(password);
    setShowPassword(true);
  };

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'Nome',
      sortable: true,
      render: (user) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-surface-hover rounded-full flex items-center justify-center text-sm font-medium text-white">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              user.name.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <p className="font-medium">{user.name}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Papel',
      sortable: true,
      render: (user) => (
        <span className="text-gray-300">{roleLabels[user.role] || user.role}</span>
      ),
    },
    {
      key: 'cargo',
      header: 'Cargo',
      sortable: true,
      render: (user) => (
        <span className="text-gray-300">{cargoLabels[user.cargo] || user.cargo}</span>
      ),
    },
    {
      key: 'franchise',
      header: 'Franquia',
      render: (user) => (
        <span className="text-gray-400">{user.franchise?.name || '-'}</span>
      ),
    },
    {
      key: 'store',
      header: 'Loja',
      render: (user) => (
        <span className="text-gray-400">{user.store?.name || '-'}</span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (user) => <StatusBadge status={user.isActive} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Usuários"
        description="Gerencie os usuários da plataforma"
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Usuários' },
        ]}
        action={{
          label: 'Novo Usuário',
          href: '/admin/users/new',
        }}
      />

      <DataTable
        data={users}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Buscar por nome ou email..."
        searchKey="name"
        onRowClick={(user) => router.push(`/admin/users/${user.id}`)}
        pagination={{
          page: meta.page,
          perPage: meta.perPage,
          total: meta.total,
          onPageChange: fetchUsers,
        }}
        actions={(user) => (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/admin/users/${user.id}`);
              }}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-surface-hover transition-colors"
              title="Editar"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                openPasswordModal(user);
              }}
              className="p-2 rounded-lg text-gray-400 hover:text-yellow-500 hover:bg-surface-hover transition-colors"
              title="Alterar Senha"
            >
              <Key className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteModal({ isOpen: true, user });
              }}
              className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-surface-hover transition-colors"
              title="Excluir"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
        emptyMessage="Nenhum usuário encontrado"
      />

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false })}
        onConfirm={handleDelete}
        title="Excluir Usuário"
        message={`Tem certeza que deseja desativar o usuário "${deleteModal.user?.name}"? Esta ação pode ser revertida.`}
        confirmLabel="Desativar"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* Modal de Alteração de Senha */}
      {passwordModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={closePasswordModal}
          />
          <div className="relative bg-surface-card rounded-xl border border-gray-800 p-6 w-full max-w-md mx-4 shadow-xl">
            <button
              onClick={closePasswordModal}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-semibold text-white mb-2">
              Alterar Senha
            </h3>
            <p className="text-sm text-gray-400 mb-6">
              Defina uma nova senha para <strong>{passwordModal.user?.name}</strong>
            </p>

            {passwordError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {passwordError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nova Senha
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 pr-10 bg-surface-dark border border-gray-700 rounded-lg text-white focus:outline-none focus:border-brand-500"
                    placeholder="Mínimo 6 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={generatePassword}
                className="w-full px-4 py-2 text-sm text-gray-400 hover:text-white border border-gray-700 rounded-lg hover:bg-surface-hover transition-colors"
              >
                Gerar Senha Aleatória
              </button>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closePasswordModal}
                className="flex-1 px-4 py-2.5 text-gray-400 hover:text-white border border-gray-700 rounded-lg hover:bg-surface-hover transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleResetPassword}
                disabled={isResetting || newPassword.length < 6}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isResetting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Senha'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
