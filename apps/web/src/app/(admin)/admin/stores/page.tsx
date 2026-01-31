'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Store } from 'lucide-react';
import { PageHeader, DataTable, StatusBadge, ConfirmModal, Column } from '@/components/admin';
import { api } from '@/lib/api';

interface StoreData {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  isActive: boolean;
  createdAt: string;
  franchise?: { id: string; name: string };
  usersCount?: number;
}

export default function StoresPage() {
  const router = useRouter();
  const [stores, setStores] = useState<StoreData[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, perPage: 20, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; store?: StoreData }>({ isOpen: false });
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchStores = async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await api.admin.getStores({ page, perPage: 20 });
      setStores(response.data);
      setMeta(response.meta);
    } catch (error) {
      console.error('Erro ao carregar lojas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const handleDelete = async () => {
    if (!deleteModal.store) return;
    setIsDeleting(true);
    try {
      await api.admin.deleteStore(deleteModal.store.id);
      setDeleteModal({ isOpen: false });
      fetchStores(meta.page);
    } catch (error) {
      console.error('Erro ao deletar loja:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<StoreData>[] = [
    {
      key: 'name',
      header: 'Loja',
      sortable: true,
      render: (store) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/[0.06] rounded-lg flex items-center justify-center">
            <Store className="w-5 h-5 text-brand-500" />
          </div>
          <div>
            <p className="font-medium">{store.name}</p>
            <p className="text-xs text-white/40">{store.city}{store.state ? `, ${store.state}` : ''}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'franchise',
      header: 'Franquia',
      render: (store) => (
        <span className="text-white/70">{store.franchise?.name || '-'}</span>
      ),
    },
    {
      key: 'address',
      header: 'Endereço',
      render: (store) => (
        <span className="text-white/50 text-sm truncate max-w-xs block">{store.address || '-'}</span>
      ),
    },
    {
      key: 'usersCount',
      header: 'Usuários',
      render: (store) => (
        <span className="text-white/70">{store.usersCount || 0}</span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (store) => <StatusBadge status={store.isActive} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Lojas"
        description="Gerencie as lojas das franquias"
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Lojas' },
        ]}
        action={{
          label: 'Nova Loja',
          href: '/admin/stores/new',
        }}
      />

      <DataTable
        data={stores}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Buscar por nome..."
        searchKey="name"
        onRowClick={(store) => router.push(`/admin/stores/${store.id}`)}
        pagination={{
          page: meta.page,
          perPage: meta.perPage,
          total: meta.total,
          onPageChange: fetchStores,
        }}
        actions={(store) => (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/admin/stores/${store.id}`);
              }}
              className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors"
              title="Editar"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteModal({ isOpen: true, store });
              }}
              className="p-2 rounded-lg text-white/50 hover:text-red-500 hover:bg-white/[0.06] transition-colors"
              title="Excluir"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
        emptyMessage="Nenhuma loja encontrada"
      />

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false })}
        onConfirm={handleDelete}
        title="Excluir Loja"
        message={`Tem certeza que deseja excluir a loja "${deleteModal.store?.name}"?`}
        confirmLabel="Excluir"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
