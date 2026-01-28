'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Route, BookOpen } from 'lucide-react';
import { PageHeader, DataTable, StatusBadge, ConfirmModal, Column } from '@/components/admin';
import { api } from '@/lib/api';

interface Track {
  id: string;
  name: string;
  description?: string;
  thumbnailUrl?: string;
  isActive: boolean;
  createdAt: string;
  _count?: {
    courses: number;
    enrollments: number;
  };
  courses?: { id: string; title: string }[];
}

interface TracksResponse {
  data: Track[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

export default function TracksPage() {
  const router = useRouter();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, perPage: 20, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; track?: Track }>({ isOpen: false });
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTracks = async (page = 1) => {
    setIsLoading(true);
    try {
      const response: TracksResponse = await api.admin.getTracks({ page, perPage: 20 });
      setTracks(response.data || response as any || []);
      setMeta(response.meta || { total: 0, page: 1, perPage: 20, totalPages: 1 });
    } catch (error) {
      console.error('Erro ao carregar trilhas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTracks();
  }, []);

  const handleDelete = async () => {
    if (!deleteModal.track) return;
    setIsDeleting(true);
    try {
      await api.admin.deleteTrack(deleteModal.track.id);
      setDeleteModal({ isOpen: false });
      fetchTracks(meta.page);
    } catch (error) {
      console.error('Erro ao deletar trilha:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<Track>[] = [
    {
      key: 'name',
      header: 'Trilha',
      sortable: true,
      render: (track) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-surface-hover rounded-lg flex items-center justify-center overflow-hidden">
            {track.thumbnailUrl ? (
              <img src={track.thumbnailUrl} alt={track.name} className="w-full h-full object-cover" />
            ) : (
              <Route className="w-6 h-6 text-brand-500" />
            )}
          </div>
          <div>
            <p className="font-medium">{track.name}</p>
            {track.description && (
              <p className="text-xs text-gray-500 line-clamp-1">{track.description}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'courses',
      header: 'Cursos',
      render: (track) => (
        <div className="flex items-center gap-1 text-gray-300">
          <BookOpen className="w-4 h-4" />
          {track._count?.courses || track.courses?.length || 0}
        </div>
      ),
    },
    {
      key: 'enrollments',
      header: 'Matrículas',
      render: (track) => (
        <span className="text-gray-300">{track._count?.enrollments || 0}</span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (track) => <StatusBadge status={track.isActive} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Trilhas"
        description="Gerencie as trilhas de aprendizado"
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Trilhas' },
        ]}
        action={{
          label: 'Nova Trilha',
          href: '/admin/tracks/new',
        }}
      />

      <DataTable
        data={tracks}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Buscar por nome..."
        searchKey="name"
        onRowClick={(track) => router.push(`/admin/tracks/${track.id}`)}
        pagination={{
          page: meta.page,
          perPage: meta.perPage,
          total: meta.total,
          onPageChange: fetchTracks,
        }}
        actions={(track) => (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/admin/tracks/${track.id}`);
              }}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-surface-hover transition-colors"
              title="Editar"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteModal({ isOpen: true, track });
              }}
              className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-surface-hover transition-colors"
              title="Excluir"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
        emptyMessage="Nenhuma trilha encontrada"
      />

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false })}
        onConfirm={handleDelete}
        title="Excluir Trilha"
        message={`Tem certeza que deseja excluir a trilha "${deleteModal.track?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
