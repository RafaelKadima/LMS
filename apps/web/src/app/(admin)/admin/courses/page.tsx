'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Eye, MoreHorizontal, BookOpen, Users } from 'lucide-react';
import { PageHeader, DataTable, StatusBadge, ConfirmModal, Column } from '@/components/admin';
import { api } from '@/lib/api';

interface Course {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  status: 'draft' | 'published' | 'archived';
  durationMinutes: number;
  isRequired: boolean;
  createdAt: string;
  _count?: {
    modules: number;
    enrollments: number;
  };
}

interface CoursesResponse {
  data: Course[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

const statusLabels: Record<string, { label: string; color: string }> = {
  draft: { label: 'Rascunho', color: 'bg-yellow-500/10 text-yellow-500' },
  published: { label: 'Publicado', color: 'bg-green-500/10 text-green-500' },
  archived: { label: 'Arquivado', color: 'bg-gray-500/10 text-gray-400' },
};

export default function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, perPage: 20, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; course?: Course }>({ isOpen: false });
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCourses = async (page = 1) => {
    setIsLoading(true);
    try {
      const response: CoursesResponse = await api.admin.getCourses({ page, perPage: 20 });
      setCourses(response.data || []);
      setMeta(response.meta || { total: 0, page: 1, perPage: 20, totalPages: 1 });
    } catch (error) {
      console.error('Erro ao carregar cursos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleDelete = async () => {
    if (!deleteModal.course) return;
    setIsDeleting(true);
    try {
      await api.admin.deleteCourse(deleteModal.course.id);
      setDeleteModal({ isOpen: false });
      fetchCourses(meta.page);
    } catch (error) {
      console.error('Erro ao deletar curso:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const columns: Column<Course>[] = [
    {
      key: 'title',
      header: 'Curso',
      sortable: true,
      render: (course) => (
        <div className="flex items-center gap-3">
          <div className="w-16 h-10 bg-surface-hover rounded-lg flex items-center justify-center overflow-hidden">
            {course.thumbnailUrl ? (
              <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
            ) : (
              <BookOpen className="w-5 h-5 text-gray-500" />
            )}
          </div>
          <div>
            <p className="font-medium">{course.title}</p>
            <p className="text-xs text-gray-500">{formatDuration(course.durationMinutes)}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'modules',
      header: 'Módulos',
      render: (course) => (
        <span className="text-gray-300">{course._count?.modules || 0}</span>
      ),
    },
    {
      key: 'enrollments',
      header: 'Matrículas',
      render: (course) => (
        <div className="flex items-center gap-1 text-gray-300">
          <Users className="w-4 h-4" />
          {course._count?.enrollments || 0}
        </div>
      ),
    },
    {
      key: 'isRequired',
      header: 'Obrigatório',
      render: (course) => (
        <span className={course.isRequired ? 'text-brand-500' : 'text-gray-500'}>
          {course.isRequired ? 'Sim' : 'Não'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (course) => {
        const status = statusLabels[course.status] || statusLabels.draft;
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
            {status.label}
          </span>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Cursos"
        description="Gerencie os cursos da plataforma"
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Cursos' },
        ]}
        action={{
          label: 'Novo Curso',
          href: '/admin/courses/new',
        }}
      />

      <DataTable
        data={courses}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Buscar por título..."
        searchKey="title"
        onRowClick={(course) => router.push(`/admin/courses/${course.id}`)}
        pagination={{
          page: meta.page,
          perPage: meta.perPage,
          total: meta.total,
          onPageChange: fetchCourses,
        }}
        actions={(course) => (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.open(`/course/${course.id}`, '_blank');
              }}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-surface-hover transition-colors"
              title="Visualizar"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/admin/courses/${course.id}`);
              }}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-surface-hover transition-colors"
              title="Editar"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteModal({ isOpen: true, course });
              }}
              className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-surface-hover transition-colors"
              title="Excluir"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
        emptyMessage="Nenhum curso encontrado"
      />

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false })}
        onConfirm={handleDelete}
        title="Excluir Curso"
        message={`Tem certeza que deseja excluir o curso "${deleteModal.course?.title}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
