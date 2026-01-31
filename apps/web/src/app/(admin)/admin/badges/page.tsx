'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Award } from 'lucide-react';
import { PageHeader, DataTable, ConfirmModal, Column } from '@/components/admin';
import { api } from '@/lib/api';

interface Badge {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  points: number;
  criteriaJson: any;
  createdAt: string;
  awardsCount: number;
}

export default function BadgesPage() {
  const router = useRouter();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, perPage: 20, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; badge?: Badge }>({ isOpen: false });
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchBadges = async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await api.admin.getBadges({ page, perPage: 20 });
      setBadges(response.data);
      setMeta(response.meta);
    } catch (error) {
      console.error('Erro ao carregar badges:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBadges();
  }, []);

  const handleDelete = async () => {
    if (!deleteModal.badge) return;
    setIsDeleting(true);
    try {
      await api.admin.deleteBadge(deleteModal.badge.id);
      setDeleteModal({ isOpen: false });
      fetchBadges(meta.page);
    } catch (error) {
      console.error('Erro ao deletar badge:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<Badge>[] = [
    {
      key: 'name',
      header: 'Badge',
      sortable: true,
      render: (badge) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/[0.06] rounded-lg flex items-center justify-center">
            {badge.imageUrl ? (
              <img src={badge.imageUrl} alt={badge.name} className="w-8 h-8 object-contain" />
            ) : (
              <Award className="w-5 h-5 text-brand-500" />
            )}
          </div>
          <div>
            <p className="font-medium">{badge.name}</p>
            <p className="text-xs text-white/40 truncate max-w-xs">{badge.description}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'points',
      header: 'Pontos',
      sortable: true,
      render: (badge) => (
        <span className="text-brand-500 font-medium">{badge.points} pts</span>
      ),
    },
    {
      key: 'awardsCount',
      header: 'Conquistados',
      sortable: true,
      render: (badge) => (
        <span className="text-white/70">{badge.awardsCount} usuários</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Criado em',
      render: (badge) => (
        <span className="text-white/50">
          {new Date(badge.createdAt).toLocaleDateString('pt-BR')}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Badges"
        description="Gerencie os badges de conquista"
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Badges' },
        ]}
        action={{
          label: 'Novo Badge',
          href: '/admin/badges/new',
        }}
      />

      <DataTable
        data={badges}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Buscar por nome..."
        searchKey="name"
        onRowClick={(badge) => router.push(`/admin/badges/${badge.id}`)}
        pagination={{
          page: meta.page,
          perPage: meta.perPage,
          total: meta.total,
          onPageChange: fetchBadges,
        }}
        actions={(badge) => (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/admin/badges/${badge.id}`);
              }}
              className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors"
              title="Editar"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteModal({ isOpen: true, badge });
              }}
              className="p-2 rounded-lg text-white/50 hover:text-red-500 hover:bg-white/[0.06] transition-colors"
              title="Excluir"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
        emptyMessage="Nenhum badge encontrado"
      />

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false })}
        onConfirm={handleDelete}
        title="Excluir Badge"
        message={`Tem certeza que deseja excluir o badge "${deleteModal.badge?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
