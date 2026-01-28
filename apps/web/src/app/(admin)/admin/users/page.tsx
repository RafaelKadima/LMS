'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Key, MoreHorizontal } from 'lucide-react';
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

  const handleResetPassword = async (userId: string) => {
    try {
      const result = await api.admin.resetPassword(userId);
      if (result.temporaryPassword) {
        alert(`Nova senha temporária: ${result.temporaryPassword}`);
      } else {
        alert('Senha resetada com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao resetar senha:', error);
      alert('Erro ao resetar senha');
    }
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
                handleResetPassword(user.id);
              }}
              className="p-2 rounded-lg text-gray-400 hover:text-yellow-500 hover:bg-surface-hover transition-colors"
              title="Resetar Senha"
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
    </div>
  );
}
