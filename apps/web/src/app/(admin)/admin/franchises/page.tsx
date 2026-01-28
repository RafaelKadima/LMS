'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Building2 } from 'lucide-react';
import { PageHeader, DataTable, StatusBadge, ConfirmModal, Column } from '@/components/admin';
import { api } from '@/lib/api';

interface Franchise {
  id: string;
  name: string;
  cnpj: string;
  slug: string;
  logoUrl?: string;
  isActive: boolean;
  createdAt: string;
  storesCount?: number;
  usersCount?: number;
}

export default function FranchisesPage() {
  const router = useRouter();
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, perPage: 20, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; franchise?: Franchise }>({ isOpen: false });
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchFranchises = async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await api.admin.getFranchises({ page, perPage: 20 });
      // A API pode retornar array direto ou objeto paginado
      const data = Array.isArray(response) ? response : response.data;
      const franchisesData = data.map((f: any) => ({
        ...f,
        storesCount: f._count?.stores || 0,
        usersCount: f._count?.users || 0,
      }));
      setFranchises(franchisesData);
      if (!Array.isArray(response) && response.meta) {
        setMeta(response.meta);
      } else {
        setMeta({ total: franchisesData.length, page: 1, perPage: 20, totalPages: 1 });
      }
    } catch (error) {
      console.error('Erro ao carregar franquias:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFranchises();
  }, []);

  const handleDelete = async () => {
    if (!deleteModal.franchise) return;
    setIsDeleting(true);
    try {
      await api.admin.deleteFranchise(deleteModal.franchise.id);
      setDeleteModal({ isOpen: false });
      fetchFranchises(meta.page);
    } catch (error) {
      console.error('Erro ao deletar franquia:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<Franchise>[] = [
    {
      key: 'name',
      header: 'Franquia',
      sortable: true,
      render: (franchise) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-surface-hover rounded-lg flex items-center justify-center">
            {franchise.logoUrl ? (
              <img src={franchise.logoUrl} alt={franchise.name} className="w-8 h-8 object-contain rounded" />
            ) : (
              <Building2 className="w-5 h-5 text-brand-500" />
            )}
          </div>
          <div>
            <p className="font-medium">{franchise.name}</p>
            <p className="text-xs text-gray-500">{franchise.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'cnpj',
      header: 'CNPJ',
      render: (franchise) => (
        <span className="text-gray-300 font-mono text-sm">{franchise.cnpj}</span>
      ),
    },
    {
      key: 'storesCount',
      header: 'Lojas',
      render: (franchise) => (
        <span className="text-gray-300">{franchise.storesCount || 0}</span>
      ),
    },
    {
      key: 'usersCount',
      header: 'Usuários',
      render: (franchise) => (
        <span className="text-gray-300">{franchise.usersCount || 0}</span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (franchise) => <StatusBadge status={franchise.isActive} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Franquias"
        description="Gerencie as franquias do sistema"
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Franquias' },
        ]}
        action={{
          label: 'Nova Franquia',
          href: '/admin/franchises/new',
        }}
      />

      <DataTable
        data={franchises}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Buscar por nome ou CNPJ..."
        searchKey="name"
        onRowClick={(franchise) => router.push(`/admin/franchises/${franchise.id}`)}
        pagination={{
          page: meta.page,
          perPage: meta.perPage,
          total: meta.total,
          onPageChange: fetchFranchises,
        }}
        actions={(franchise) => (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/admin/franchises/${franchise.id}`);
              }}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-surface-hover transition-colors"
              title="Editar"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteModal({ isOpen: true, franchise });
              }}
              className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-surface-hover transition-colors"
              title="Excluir"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
        emptyMessage="Nenhuma franquia encontrada"
      />

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false })}
        onConfirm={handleDelete}
        title="Excluir Franquia"
        message={`Tem certeza que deseja excluir a franquia "${deleteModal.franchise?.name}"?`}
        confirmLabel="Excluir"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
