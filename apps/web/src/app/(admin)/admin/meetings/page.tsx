'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Video, Play, Square } from 'lucide-react';
import { PageHeader, DataTable, ConfirmModal, StatusBadge, Column } from '@/components/admin';

import { api } from '@/lib/api';

interface Meeting {
  id: string;
  title: string;
  type: string;
  status: string;
  scheduledAt: string;
  durationMinutes: number;
  scope: string;
  createdBy: { id: string; name: string };
  franchise?: { id: string; name: string };
  store?: { id: string; name: string };
  _count: { participants: number };
}

const typeLabels: Record<string, string> = {
  meeting: 'Reunião',
  seminar: 'Seminário',
  training: 'Treinamento',
};

const scopeLabels: Record<string, string> = {
  broadcast: 'Todos',
  franchise: 'Franquia',
  store: 'Loja',
  manual: 'Manual',
};

const statusLabels: Record<string, string> = {
  scheduled: 'Agendada',
  live: 'Ao Vivo',
  ended: 'Encerrada',
  cancelled: 'Cancelada',
};

export default function AdminMeetingsPage() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, perPage: 20 });
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; meeting?: Meeting }>({ isOpen: false });
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchMeetings = async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await api.meetings.getAllAdmin({ page, perPage: 20 });
      setMeetings(response.data);
      setMeta({ total: response.total, page: response.page, perPage: response.perPage });
    } catch (error) {
      console.error('Erro ao carregar reuniões:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const handleDelete = async () => {
    if (!deleteModal.meeting) return;
    setIsDeleting(true);
    try {
      await api.meetings.delete(deleteModal.meeting.id);
      setDeleteModal({ isOpen: false });
      fetchMeetings(meta.page);
    } catch (error) {
      console.error('Erro ao cancelar reunião:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStart = async (meeting: Meeting) => {
    try {
      await api.meetings.start(meeting.id);
      fetchMeetings(meta.page);
    } catch (error) {
      console.error('Erro ao iniciar reunião:', error);
    }
  };

  const handleEnd = async (meeting: Meeting) => {
    try {
      await api.meetings.end(meeting.id);
      fetchMeetings(meta.page);
    } catch (error) {
      console.error('Erro ao encerrar reunião:', error);
    }
  };

  const columns: Column<Meeting>[] = [
    {
      key: 'title',
      header: 'Reunião',
      sortable: true,
      render: (m) => (
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
            m.type === 'seminar' ? 'bg-purple-500/10 text-purple-400' :
            m.type === 'training' ? 'bg-green-500/10 text-green-400' :
            'bg-blue-500/10 text-blue-400'
          }`}>
            <Video className="w-5 h-5" />
          </div>
          <div>
            <p className="font-medium">{m.title}</p>
            <p className="text-xs text-white/40">{typeLabels[m.type] || m.type}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'scheduledAt',
      header: 'Data/Hora',
      sortable: true,
      render: (m) => (
        <div className="text-sm">
          <p className="text-white/70">{new Date(m.scheduledAt).toLocaleDateString('pt-BR')}</p>
          <p className="text-xs text-white/40">{new Date(m.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - {m.durationMinutes}min</p>
        </div>
      ),
    },
    {
      key: 'scope',
      header: 'Escopo',
      render: (m) => (
        <div className="text-sm">
          <p className="text-white/70">{scopeLabels[m.scope] || m.scope}</p>
          {m.franchise && <p className="text-xs text-white/40">{m.franchise.name}</p>}
          {m.store && <p className="text-xs text-white/40">{m.store.name}</p>}
        </div>
      ),
    },
    {
      key: 'participants',
      header: 'Participantes',
      render: (m) => (
        <span className="text-white/70">{m._count.participants}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (m) => (
        <StatusBadge status={m.status} labels={statusLabels} />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Reuniões"
        description="Gerencie reuniões, seminários e treinamentos"
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Reuniões' },
        ]}
        action={{
          label: 'Nova Reunião',
          href: '/admin/meetings/new',
        }}
      />

      <DataTable
        data={meetings}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Buscar por título..."
        searchKey="title"
        onRowClick={(m) => router.push(`/admin/meetings/${m.id}`)}
        pagination={{
          page: meta.page,
          perPage: meta.perPage,
          total: meta.total,
          onPageChange: fetchMeetings,
        }}
        actions={(m) => (
          <>
            {m.status === 'scheduled' && (
              <button
                onClick={(e) => { e.stopPropagation(); handleStart(m); }}
                className="p-2 rounded-lg text-white/50 hover:text-green-400 hover:bg-white/[0.06] transition-colors"
                title="Iniciar"
              >
                <Play className="w-4 h-4" />
              </button>
            )}
            {m.status === 'live' && (
              <button
                onClick={(e) => { e.stopPropagation(); handleEnd(m); }}
                className="p-2 rounded-lg text-white/50 hover:text-yellow-400 hover:bg-white/[0.06] transition-colors"
                title="Encerrar"
              >
                <Square className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); router.push(`/admin/meetings/${m.id}`); }}
              className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors"
              title="Editar"
            >
              <Pencil className="w-4 h-4" />
            </button>
            {m.status !== 'cancelled' && m.status !== 'ended' && (
              <button
                onClick={(e) => { e.stopPropagation(); setDeleteModal({ isOpen: true, meeting: m }); }}
                className="p-2 rounded-lg text-white/50 hover:text-red-500 hover:bg-white/[0.06] transition-colors"
                title="Cancelar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </>
        )}
        emptyMessage="Nenhuma reunião encontrada"
      />

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false })}
        onConfirm={handleDelete}
        title="Cancelar Reunião"
        message={`Tem certeza que deseja cancelar a reunião "${deleteModal.meeting?.title}"? Os participantes serão notificados.`}
        confirmLabel="Cancelar Reunião"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
