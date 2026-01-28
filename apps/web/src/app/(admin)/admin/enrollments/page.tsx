'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, UserPlus, BookOpen, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { PageHeader, DataTable, ConfirmModal, Column } from '@/components/admin';
import { api } from '@/lib/api';

interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  status: 'active' | 'completed' | 'cancelled';
  progress: number;
  enrolledAt: string;
  completedAt?: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  course: {
    id: string;
    title: string;
    thumbnailUrl?: string;
  };
}

interface EnrollmentsResponse {
  data: Enrollment[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

interface Course {
  id: string;
  title: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

const statusLabels: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  active: { label: 'Em Andamento', color: 'bg-blue-500/10 text-blue-500', icon: Clock },
  completed: { label: 'Concluído', color: 'bg-green-500/10 text-green-500', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: 'bg-red-500/10 text-red-500', icon: XCircle },
};

export default function EnrollmentsPage() {
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, perPage: 20, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; enrollment?: Enrollment }>({ isOpen: false });
  const [isDeleting, setIsDeleting] = useState(false);

  // New Enrollment Modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [newEnrollment, setNewEnrollment] = useState({ userId: '', courseId: '' });
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchEnrollments = async (page = 1) => {
    setIsLoading(true);
    try {
      const response: EnrollmentsResponse = await api.admin.getEnrollments({ page, perPage: 20 });
      setEnrollments(response.data || []);
      setMeta(response.meta || { total: 0, page: 1, perPage: 20, totalPages: 1 });
    } catch (error) {
      console.error('Erro ao carregar matrículas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCoursesAndUsers = async () => {
    try {
      const [coursesRes, usersRes] = await Promise.all([
        api.admin.getCourses({ perPage: 100 }),
        api.admin.getUsers({ perPage: 100 }),
      ]);
      setCourses(coursesRes.data || []);
      setUsers(usersRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar cursos e usuários:', error);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const handleDelete = async () => {
    if (!deleteModal.enrollment) return;
    setIsDeleting(true);
    try {
      await api.admin.deleteEnrollment(deleteModal.enrollment.id);
      setDeleteModal({ isOpen: false });
      fetchEnrollments(meta.page);
    } catch (error) {
      console.error('Erro ao cancelar matrícula:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenNewModal = async () => {
    await fetchCoursesAndUsers();
    setShowNewModal(true);
  };

  const handleCreateEnrollment = async () => {
    if (!newEnrollment.userId || !newEnrollment.courseId) {
      setCreateError('Selecione um usuário e um curso');
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      await api.admin.createEnrollment(newEnrollment);
      setShowNewModal(false);
      setNewEnrollment({ userId: '', courseId: '' });
      fetchEnrollments(1);
    } catch (error: any) {
      setCreateError(error.response?.data?.message || 'Erro ao criar matrícula');
    } finally {
      setIsCreating(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const columns: Column<Enrollment>[] = [
    {
      key: 'user',
      header: 'Usuário',
      sortable: true,
      render: (enrollment) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-surface-hover rounded-full flex items-center justify-center text-sm font-medium text-white">
            {enrollment.user?.avatarUrl ? (
              <img src={enrollment.user.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              enrollment.user?.name?.charAt(0).toUpperCase() || '?'
            )}
          </div>
          <div>
            <p className="font-medium">{enrollment.user?.name}</p>
            <p className="text-xs text-gray-500">{enrollment.user?.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'course',
      header: 'Curso',
      render: (enrollment) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-8 bg-surface-hover rounded overflow-hidden">
            {enrollment.course?.thumbnailUrl ? (
              <img src={enrollment.course.thumbnailUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-gray-500" />
              </div>
            )}
          </div>
          <span className="text-gray-300">{enrollment.course?.title}</span>
        </div>
      ),
    },
    {
      key: 'progress',
      header: 'Progresso',
      render: (enrollment) => (
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 bg-surface-hover rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-all"
              style={{ width: `${enrollment.progress}%` }}
            />
          </div>
          <span className="text-sm text-gray-400">{enrollment.progress}%</span>
        </div>
      ),
    },
    {
      key: 'enrolledAt',
      header: 'Data Matrícula',
      sortable: true,
      render: (enrollment) => (
        <span className="text-gray-400">{formatDate(enrollment.enrolledAt)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (enrollment) => {
        const status = statusLabels[enrollment.status] || statusLabels.active;
        const Icon = status.icon;
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
            <Icon className="w-3 h-3" />
            {status.label}
          </span>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Matrículas"
        description="Gerencie as matrículas dos usuários nos cursos"
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Matrículas' },
        ]}
        action={{
          label: 'Nova Matrícula',
          onClick: handleOpenNewModal,
        }}
      />

      <DataTable
        data={enrollments}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Buscar por usuário ou curso..."
        searchKey="user.name"
        pagination={{
          page: meta.page,
          perPage: meta.perPage,
          total: meta.total,
          onPageChange: fetchEnrollments,
        }}
        actions={(enrollment) => (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteModal({ isOpen: true, enrollment });
              }}
              className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-surface-hover transition-colors"
              title="Cancelar Matrícula"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
        emptyMessage="Nenhuma matrícula encontrada"
      />

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false })}
        onConfirm={handleDelete}
        title="Cancelar Matrícula"
        message={`Tem certeza que deseja cancelar a matrícula de "${deleteModal.enrollment?.user?.name}" no curso "${deleteModal.enrollment?.course?.title}"?`}
        confirmLabel="Cancelar Matrícula"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* New Enrollment Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-card rounded-xl border border-gray-800 w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-500/10 rounded-lg flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-brand-500" />
                </div>
                <h3 className="text-lg font-semibold text-white">Nova Matrícula</h3>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-gray-400 hover:text-white text-xl"
              >
                ×
              </button>
            </div>

            {createError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                {createError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Usuário *</label>
                <select
                  value={newEnrollment.userId}
                  onChange={(e) => setNewEnrollment({ ...newEnrollment, userId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-surface-dark border border-gray-700 rounded-lg text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="">Selecione um usuário...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Curso *</label>
                <select
                  value={newEnrollment.courseId}
                  onChange={(e) => setNewEnrollment({ ...newEnrollment, courseId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-surface-dark border border-gray-700 rounded-lg text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="">Selecione um curso...</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-6 pt-4 border-t border-gray-800">
              <button
                onClick={handleCreateEnrollment}
                disabled={isCreating}
                className="flex items-center gap-2 px-6 py-2.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 font-medium disabled:opacity-50"
              >
                {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                {isCreating ? 'Matriculando...' : 'Matricular'}
              </button>
              <button
                onClick={() => setShowNewModal(false)}
                className="px-6 py-2.5 text-gray-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
