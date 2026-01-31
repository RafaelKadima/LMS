'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Save, ArrowLeft, Loader2, Plus, Trash2, GripVertical, BookOpen, Route } from 'lucide-react';
import { PageHeader } from '@/components/admin';
import { api } from '@/lib/api';

interface Course {
  id: string;
  title: string;
  thumbnailUrl?: string;
  durationMinutes: number;
}

interface TrackCourse {
  id: string;
  courseId: string;
  order: number;
  course: Course;
}

interface TrackForm {
  name: string;
  description: string;
  thumbnailUrl: string;
  isActive: boolean;
}

export default function TrackFormPage() {
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === 'new';
  const trackId = isNew ? null : params.id as string;

  const [form, setForm] = useState<TrackForm>({
    name: '',
    description: '',
    thumbnailUrl: '',
    isActive: true,
  });
  const [trackCourses, setTrackCourses] = useState<TrackCourse[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCourseSelector, setShowCourseSelector] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch available courses
        const coursesRes = await api.admin.getCourses({ perPage: 100 });
        setAvailableCourses(coursesRes.data || []);

        if (trackId) {
          const track = await api.admin.getTrack(trackId);
          setForm({
            name: track.name,
            description: track.description || '',
            thumbnailUrl: track.thumbnailUrl || '',
            isActive: track.isActive,
          });
          setTrackCourses(track.trackCourses || []);
        }
      } catch (err) {
        setError('Erro ao carregar dados');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [trackId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        thumbnailUrl: form.thumbnailUrl || undefined,
        isActive: form.isActive,
      };

      if (isNew) {
        await api.admin.createTrack(payload);
      } else {
        await api.admin.updateTrack(trackId!, payload);
      }
      router.push('/admin/tracks');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao salvar trilha');
    } finally {
      setIsSaving(false);
    }
  };

  const addCourse = async (course: Course) => {
    if (!trackId) return;

    const order = trackCourses.length;
    try {
      await api.admin.addCourseToTrack(trackId, course.id, order);
      setTrackCourses([...trackCourses, {
        id: `temp-${Date.now()}`,
        courseId: course.id,
        order,
        course,
      }]);
      setShowCourseSelector(false);
    } catch (err) {
      console.error('Erro ao adicionar curso:', err);
    }
  };

  const removeCourse = async (courseId: string) => {
    if (!trackId) return;

    try {
      await api.admin.removeCourseFromTrack(trackId, courseId);
      setTrackCourses(trackCourses.filter(tc => tc.courseId !== courseId));
    } catch (err) {
      console.error('Erro ao remover curso:', err);
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const coursesNotInTrack = availableCourses.filter(
    c => !trackCourses.some(tc => tc.courseId === c.id)
  );

  const totalDuration = trackCourses.reduce(
    (acc, tc) => acc + (tc.course?.durationMinutes || 0),
    0
  );

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
        title={isNew ? 'Nova Trilha' : 'Editar Trilha'}
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Trilhas', href: '/admin/tracks' },
          { label: isNew ? 'Nova' : 'Editar' },
        ]}
      >
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2.5 text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário Principal */}
        <div className="col-span-2">
          <form onSubmit={handleSubmit}>
            <div className="glass rounded-2xl border border-white/[0.06] p-6 space-y-6">
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Nome *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors"
                  placeholder="Trilha de Atendimento"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Descrição</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors resize-none"
                  placeholder="Descreva o objetivo desta trilha..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">URL da Thumbnail</label>
                  <input
                    type="url"
                    value={form.thumbnailUrl}
                    onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors"
                    placeholder="https://..."
                  />
                </div>
                <div className="flex items-end">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={form.isActive}
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                      className="w-4 h-4 rounded border-white/[0.08] bg-white/[0.04] text-brand-500"
                    />
                    <label htmlFor="isActive" className="text-sm text-white/70">Trilha ativa</label>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-white/[0.06]">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-brand-500 text-white rounded-xl hover:bg-brand-600 font-medium disabled:opacity-50 transition-colors shadow-glow"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {isSaving ? 'Salvando...' : 'Salvar Trilha'}
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-2.5 text-white/50 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </form>

          {/* Cursos da Trilha */}
          {!isNew && (
            <div className="mt-6 glass rounded-2xl border border-white/[0.06] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-display font-semibold tracking-tight text-white">Cursos da Trilha</h2>
                <button
                  onClick={() => setShowCourseSelector(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/[0.06] text-white rounded-lg hover:bg-white/[0.08] text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Curso
                </button>
              </div>

              <div className="space-y-2">
                {trackCourses.map((tc, index) => (
                  <div
                    key={tc.id}
                    className="flex items-center gap-3 p-3 bg-white/[0.04] rounded-lg"
                  >
                    <GripVertical className="w-5 h-5 text-white/40 cursor-grab" />
                    <span className="w-6 h-6 bg-white/[0.06] rounded-full flex items-center justify-center text-xs text-white/50">
                      {index + 1}
                    </span>
                    <div className="w-12 h-8 bg-white/[0.06] rounded overflow-hidden">
                      {tc.course?.thumbnailUrl ? (
                        <img src={tc.course.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-4 h-4 text-white/40" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">{tc.course?.title}</p>
                      <p className="text-xs text-white/40">{formatDuration(tc.course?.durationMinutes || 0)}</p>
                    </div>
                    <button
                      onClick={() => removeCourse(tc.courseId)}
                      className="p-1.5 text-white/40 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {trackCourses.length === 0 && (
                  <div className="text-center py-8 text-white/40">
                    <Route className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum curso adicionado</p>
                    <p className="text-sm">Clique em "Adicionar Curso" para começar</p>
                  </div>
                )}
              </div>

              {/* Course Selector Modal */}
              {showCourseSelector && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
                  <div className="glass rounded-2xl border border-white/[0.06] w-full max-w-lg max-h-[80vh] overflow-hidden">
                    <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
                      <h3 className="text-lg font-display font-semibold tracking-tight text-white">Adicionar Curso</h3>
                      <button
                        onClick={() => setShowCourseSelector(false)}
                        className="text-white/50 hover:text-white"
                      >
                        ×
                      </button>
                    </div>
                    <div className="p-4 max-h-96 overflow-y-auto">
                      {coursesNotInTrack.length > 0 ? (
                        <div className="space-y-2">
                          {coursesNotInTrack.map(course => (
                            <button
                              key={course.id}
                              onClick={() => addCourse(course)}
                              className="w-full flex items-center gap-3 p-3 bg-white/[0.04] rounded-lg hover:bg-white/[0.06] transition-colors text-left"
                            >
                              <div className="w-12 h-8 bg-white/[0.06] rounded overflow-hidden">
                                {course.thumbnailUrl ? (
                                  <img src={course.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <BookOpen className="w-4 h-4 text-white/40" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="text-white text-sm font-medium">{course.title}</p>
                                <p className="text-xs text-white/40">{formatDuration(course.durationMinutes)}</p>
                              </div>
                              <Plus className="w-5 h-5 text-brand-500" />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-white/40">
                          <p>Todos os cursos já estão na trilha</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {form.thumbnailUrl && (
            <div className="glass rounded-2xl border border-white/[0.06] p-4">
              <p className="text-sm font-medium text-white/70 mb-3">Preview</p>
              <img
                src={form.thumbnailUrl}
                alt="Thumbnail"
                className="w-full aspect-video object-cover rounded-lg"
              />
            </div>
          )}

          <div className="glass rounded-2xl border border-white/[0.06] p-4">
            <p className="text-sm font-medium text-white/70 mb-3">Informações</p>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-white/40">Status</span>
                <span className={form.isActive ? 'text-green-500' : 'text-white/50'}>
                  {form.isActive ? 'Ativa' : 'Inativa'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Cursos</span>
                <span className="text-white">{trackCourses.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Duração Total</span>
                <span className="text-white">{formatDuration(totalDuration)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
