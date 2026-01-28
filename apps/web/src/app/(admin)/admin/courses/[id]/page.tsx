'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Save,
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Video,
  FileText,
  Upload,
  X,
  Check,
  Play,
} from 'lucide-react';
import { PageHeader } from '@/components/admin';
import { api } from '@/lib/api';

// Interface para material de apoio com metadados
interface SupportMaterial {
  url: string;
  thumbnailUrl?: string;
  fileName: string;
  mimeType: string;
  size?: number;
}

interface Lesson {
  id?: string;
  title: string;
  description?: string;
  type: 'video' | 'quiz' | 'document';
  durationSeconds?: number;
  order: number;
  videoUrl?: string;
  documentUrl?: string;
  thumbnailUrl?: string;
  supportMaterials?: SupportMaterial[];
  isEditing?: boolean;
}

interface Module {
  id?: string;
  title: string;
  description?: string;
  order: number;
  lessons: Lesson[];
  isExpanded?: boolean;
}

interface CourseForm {
  title: string;
  description: string;
  thumbnailUrl: string;
  status: 'draft' | 'published' | 'archived';
  isRequired: boolean;
  durationMinutes: number;
  targetCargos: string[];
}

export default function CourseFormPage() {
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === 'new';
  const courseId = isNew ? null : (params.id as string);

  const [form, setForm] = useState<CourseForm>({
    title: '',
    description: '',
    thumbnailUrl: '',
    status: 'draft',
    isRequired: false,
    durationMinutes: 0,
    targetCargos: [],
  });
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingLessonId, setUploadingLessonId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supportFileInputRef = useRef<HTMLInputElement>(null);
  const [currentUploadLesson, setCurrentUploadLesson] = useState<{
    moduleIndex: number;
    lessonIndex: number;
  } | null>(null);
  const [uploadType, setUploadType] = useState<'content' | 'support'>('content');

  useEffect(() => {
    if (courseId) {
      const fetchCourse = async () => {
        try {
          const course = await api.getCourse(courseId);
          setForm({
            title: course.title,
            description: course.description || '',
            thumbnailUrl: course.thumbnailUrl || '',
            status: course.status,
            isRequired: course.isRequired,
            durationMinutes: course.durationMinutes,
            targetCargos: course.targetCargos || [],
          });
          setModules(
            (course.modules || []).map((m: any) => ({
              ...m,
              isExpanded: true,
              lessons: (m.lessons || []).map((l: any) => ({
                ...l,
                isEditing: false,
              })),
            }))
          );
        } catch (err) {
          setError('Erro ao carregar curso');
        } finally {
          setIsLoading(false);
        }
      };
      fetchCourse();
    }
  }, [courseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const payload = {
        title: form.title,
        description: form.description,
        thumbnailUrl: form.thumbnailUrl || undefined,
        status: form.status,
        isRequired: form.isRequired,
        durationMinutes: form.durationMinutes,
        targetCargos: form.targetCargos,
      };

      if (isNew) {
        await api.admin.createCourse(payload);
      } else {
        await api.admin.updateCourse(courseId!, payload);
      }
      router.push('/admin/courses');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao salvar curso');
    } finally {
      setIsSaving(false);
    }
  };

  const addModule = () => {
    setModules([
      ...modules,
      {
        title: `Módulo ${modules.length + 1}`,
        description: '',
        order: modules.length,
        lessons: [],
        isExpanded: true,
      },
    ]);
  };

  const updateModule = (index: number, updates: Partial<Module>) => {
    const newModules = [...modules];
    newModules[index] = { ...newModules[index], ...updates };
    setModules(newModules);
  };

  const removeModule = async (index: number) => {
    const module = modules[index];
    if (module.id) {
      try {
        await api.admin.deleteModule(module.id);
      } catch (err) {
        console.error('Erro ao deletar módulo:', err);
        return;
      }
    }
    setModules(modules.filter((_, i) => i !== index));
  };

  const addLesson = (moduleIndex: number) => {
    const newModules = [...modules];
    newModules[moduleIndex].lessons.push({
      title: `Aula ${newModules[moduleIndex].lessons.length + 1}`,
      type: 'video',
      order: newModules[moduleIndex].lessons.length,
      isEditing: true,
    });
    setModules(newModules);
  };

  const updateLesson = (
    moduleIndex: number,
    lessonIndex: number,
    updates: Partial<Lesson>
  ) => {
    const newModules = [...modules];
    newModules[moduleIndex].lessons[lessonIndex] = {
      ...newModules[moduleIndex].lessons[lessonIndex],
      ...updates,
    };
    setModules(newModules);
  };

  const removeLesson = async (moduleIndex: number, lessonIndex: number) => {
    const lesson = modules[moduleIndex].lessons[lessonIndex];
    if (lesson.id) {
      try {
        await api.admin.deleteLesson(lesson.id);
      } catch (err) {
        console.error('Erro ao deletar aula:', err);
        return;
      }
    }
    const newModules = [...modules];
    newModules[moduleIndex].lessons = newModules[moduleIndex].lessons.filter(
      (_, i) => i !== lessonIndex
    );
    setModules(newModules);
  };

  const saveModule = async (moduleIndex: number) => {
    const module = modules[moduleIndex];
    try {
      if (module.id) {
        await api.admin.updateModule(module.id, {
          title: module.title,
          description: module.description,
          order: module.order,
        });
      } else if (courseId) {
        const created = await api.admin.createModule({
          courseId,
          title: module.title,
          description: module.description,
          order: module.order,
        });
        updateModule(moduleIndex, { id: created.id });
      }
    } catch (err) {
      console.error('Erro ao salvar módulo:', err);
    }
  };

  const saveLesson = async (moduleIndex: number, lessonIndex: number) => {
    const module = modules[moduleIndex];
    const lesson = module.lessons[lessonIndex];
    try {
      if (lesson.id) {
        await api.admin.updateLesson(lesson.id, {
          title: lesson.title,
          description: lesson.description,
          type: lesson.type,
          durationSeconds: lesson.durationSeconds,
          order: lesson.order,
        });
      } else if (module.id) {
        const created = await api.admin.createLesson({
          moduleId: module.id,
          title: lesson.title,
          description: lesson.description,
          type: lesson.type,
          durationSeconds: lesson.durationSeconds,
          order: lesson.order,
        });
        updateLesson(moduleIndex, lessonIndex, { id: created.id });
      }
    } catch (err) {
      console.error('Erro ao salvar aula:', err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUploadLesson) return;

    const { moduleIndex, lessonIndex } = currentUploadLesson;
    const lesson = modules[moduleIndex].lessons[lessonIndex];

    if (!lesson.id) {
      setError('Salve a aula primeiro antes de fazer upload');
      return;
    }

    setUploadingLessonId(lesson.id);
    setUploadProgress(0);

    // Simular progresso
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 10, 90));
    }, 200);

    try {
      const result = await api.admin.uploadLessonContent(lesson.id, file, uploadType);
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Atualizar a aula com a URL do arquivo
      if (result.type === 'support') {
        // Recarregar a aula para obter os materiais atualizados do servidor
        // O servidor já adicionou o material com thumbnail
        const updatedLesson = await api.admin.getLesson(lesson.id);
        updateLesson(moduleIndex, lessonIndex, {
          supportMaterials: updatedLesson.supportMaterials || []
        });
      } else if (result.type === 'video') {
        updateLesson(moduleIndex, lessonIndex, { videoUrl: result.url, type: 'video' });
      } else if (result.type === 'document') {
        updateLesson(moduleIndex, lessonIndex, { documentUrl: result.url, type: 'document' });
      } else if (result.type === 'image') {
        updateLesson(moduleIndex, lessonIndex, { thumbnailUrl: result.url });
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      setError(err.response?.data?.message || 'Erro ao fazer upload');
    } finally {
      setUploadingLessonId(null);
      setUploadProgress(0);
      setCurrentUploadLesson(null);
      setUploadType('content');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (supportFileInputRef.current) {
        supportFileInputRef.current.value = '';
      }
    }
  };

  const triggerUpload = (moduleIndex: number, lessonIndex: number, type: 'content' | 'support' = 'content') => {
    setCurrentUploadLesson({ moduleIndex, lessonIndex });
    setUploadType(type);
    if (type === 'support') {
      supportFileInputRef.current?.click();
    } else {
      fileInputRef.current?.click();
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
        title={isNew ? 'Novo Curso' : 'Editar Curso'}
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Cursos', href: '/admin/courses' },
          { label: isNew ? 'Novo' : 'Editar' },
        ]}
      >
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2.5 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </button>
      </PageHeader>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,application/pdf,.doc,.docx,.ppt,.pptx,image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
      <input
        ref={supportFileInputRef}
        type="file"
        accept="application/pdf,.doc,.docx,.ppt,.pptx"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className="grid grid-cols-3 gap-6">
        {/* Formulário Principal */}
        <div className="col-span-2">
          <form onSubmit={handleSubmit}>
            <div className="bg-surface-card rounded-xl border border-gray-800 p-6 space-y-6">
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm flex items-center justify-between">
                  {error}
                  <button onClick={() => setError(null)}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 bg-surface-dark border border-gray-700 rounded-lg text-white focus:outline-none focus:border-brand-500"
                  placeholder="Treinamento de Atendimento"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Descrição
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={4}
                  className="w-full px-4 py-2.5 bg-surface-dark border border-gray-700 rounded-lg text-white focus:outline-none focus:border-brand-500 resize-none"
                  placeholder="Descreva o conteúdo do curso..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    URL da Thumbnail
                  </label>
                  <input
                    type="url"
                    value={form.thumbnailUrl}
                    onChange={(e) =>
                      setForm({ ...form, thumbnailUrl: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-surface-dark border border-gray-700 rounded-lg text-white focus:outline-none focus:border-brand-500"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value as any })
                    }
                    className="w-full px-4 py-2.5 bg-surface-dark border border-gray-700 rounded-lg text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="draft">Rascunho</option>
                    <option value="published">Publicado</option>
                    <option value="archived">Arquivado</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isRequired"
                    checked={form.isRequired}
                    onChange={(e) =>
                      setForm({ ...form, isRequired: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-gray-700 bg-surface-dark text-brand-500"
                  />
                  <label htmlFor="isRequired" className="text-sm text-gray-300">
                    Curso obrigatório
                  </label>
                </div>
              </div>

              {/* Seleção de Cargos */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cargos que podem acessar
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Deixe vazio para disponibilizar para todos os cargos
                </p>
                <div className="flex flex-wrap gap-3">
                  {['mecanico', 'atendente', 'gerente', 'proprietario'].map((cargo) => (
                    <label
                      key={cargo}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                        form.targetCargos.includes(cargo)
                          ? 'bg-brand-500/20 border-brand-500 text-brand-400'
                          : 'bg-surface-dark border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={form.targetCargos.includes(cargo)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setForm({ ...form, targetCargos: [...form.targetCargos, cargo] });
                          } else {
                            setForm({
                              ...form,
                              targetCargos: form.targetCargos.filter((c) => c !== cargo),
                            });
                          }
                        }}
                        className="sr-only"
                      />
                      <span className="capitalize">{cargo}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-gray-800">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 font-medium disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  {isSaving ? 'Salvando...' : 'Salvar Curso'}
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-2.5 text-gray-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </form>

          {/* Módulos e Aulas */}
          {!isNew && (
            <div className="mt-6 bg-surface-card rounded-xl border border-gray-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">
                  Módulos e Aulas
                </h2>
                <button
                  onClick={addModule}
                  className="flex items-center gap-2 px-4 py-2 bg-surface-hover text-white rounded-lg hover:bg-gray-700 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Módulo
                </button>
              </div>

              <div className="space-y-4">
                {modules.map((module, moduleIndex) => (
                  <div
                    key={module.id || moduleIndex}
                    className="bg-surface-dark rounded-lg border border-gray-700"
                  >
                    {/* Header do Módulo */}
                    <div className="flex items-center gap-3 p-4">
                      <GripVertical className="w-5 h-5 text-gray-500 cursor-grab" />
                      <button
                        onClick={() =>
                          updateModule(moduleIndex, {
                            isExpanded: !module.isExpanded,
                          })
                        }
                        className="text-gray-400 hover:text-white"
                      >
                        {module.isExpanded ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                      </button>
                      <input
                        type="text"
                        value={module.title}
                        onChange={(e) =>
                          updateModule(moduleIndex, { title: e.target.value })
                        }
                        onBlur={() => saveModule(moduleIndex)}
                        className="flex-1 bg-transparent text-white font-medium focus:outline-none"
                        placeholder="Nome do módulo"
                      />
                      <span className="text-xs text-gray-500">
                        {module.lessons.length} aulas
                      </span>
                      <button
                        onClick={() => removeModule(moduleIndex)}
                        className="p-1 text-gray-500 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Aulas */}
                    {module.isExpanded && (
                      <div className="border-t border-gray-700 p-4 space-y-3">
                        {module.lessons.map((lesson, lessonIndex) => (
                          <div
                            key={lesson.id || lessonIndex}
                            className="bg-surface-hover rounded-lg border border-gray-600 overflow-hidden"
                          >
                            {/* Linha principal da aula */}
                            <div
                              className="flex items-center gap-3 p-3 cursor-pointer"
                              onClick={() =>
                                updateLesson(moduleIndex, lessonIndex, {
                                  isEditing: !lesson.isEditing,
                                })
                              }
                            >
                              <GripVertical className="w-4 h-4 text-gray-500 cursor-grab" />
                              {lesson.type === 'video' ? (
                                <Video className="w-4 h-4 text-brand-500" />
                              ) : (
                                <FileText className="w-4 h-4 text-blue-500" />
                              )}
                              <span className="flex-1 text-white text-sm font-medium">
                                {lesson.title}
                              </span>
                              {lesson.supportMaterials && lesson.supportMaterials.length > 0 && (
                                <span className="text-xs text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded" title="Materiais de apoio anexados">
                                  +{lesson.supportMaterials.length} Apoio
                                </span>
                              )}
                              {lesson.videoUrl || lesson.documentUrl ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <span className="text-xs text-yellow-500">
                                  Sem conteúdo
                                </span>
                              )}
                              <span className="text-xs text-gray-500">
                                {formatDuration(lesson.durationSeconds)}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeLesson(moduleIndex, lessonIndex);
                                }}
                                className="p-1 text-gray-500 hover:text-red-500"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Painel de edição expandido */}
                            {lesson.isEditing && (
                              <div className="border-t border-gray-600 p-4 space-y-4 bg-surface-dark">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">
                                      Título da Aula
                                    </label>
                                    <input
                                      type="text"
                                      value={lesson.title}
                                      onChange={(e) =>
                                        updateLesson(moduleIndex, lessonIndex, {
                                          title: e.target.value,
                                        })
                                      }
                                      onBlur={() =>
                                        saveLesson(moduleIndex, lessonIndex)
                                      }
                                      className="w-full px-3 py-2 bg-surface-hover border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-brand-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">
                                      Tipo de Conteúdo
                                    </label>
                                    <select
                                      value={lesson.type}
                                      onChange={(e) =>
                                        updateLesson(moduleIndex, lessonIndex, {
                                          type: e.target.value as any,
                                        })
                                      }
                                      onBlur={() =>
                                        saveLesson(moduleIndex, lessonIndex)
                                      }
                                      className="w-full px-3 py-2 bg-surface-hover border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-brand-500"
                                    >
                                      <option value="video">Vídeo</option>
                                      <option value="document">Documento</option>
                                    </select>
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-gray-400 mb-1">
                                    Descrição
                                  </label>
                                  <textarea
                                    value={lesson.description || ''}
                                    onChange={(e) =>
                                      updateLesson(moduleIndex, lessonIndex, {
                                        description: e.target.value,
                                      })
                                    }
                                    onBlur={() =>
                                      saveLesson(moduleIndex, lessonIndex)
                                    }
                                    rows={2}
                                    className="w-full px-3 py-2 bg-surface-hover border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-brand-500 resize-none"
                                    placeholder="Descrição da aula..."
                                  />
                                </div>

                                {/* Upload de conteúdo */}
                                <div>
                                  <label className="block text-xs font-medium text-gray-400 mb-2">
                                    Conteúdo da Aula
                                  </label>

                                  {uploadingLessonId === lesson.id ? (
                                    <div className="border border-gray-600 rounded-lg p-4">
                                      <div className="flex items-center gap-3 mb-2">
                                        <Loader2 className="w-5 h-5 text-brand-500 animate-spin" />
                                        <span className="text-sm text-gray-300">
                                          Enviando arquivo...
                                        </span>
                                      </div>
                                      <div className="w-full bg-surface-hover rounded-full h-2 overflow-hidden">
                                        <div
                                          className="bg-brand-500 h-full transition-all duration-300"
                                          style={{ width: `${uploadProgress}%` }}
                                        />
                                      </div>
                                    </div>
                                  ) : lesson.videoUrl || lesson.documentUrl ? (
                                    <div className="border border-gray-600 rounded-lg p-3">
                                      <div className="flex items-center gap-3">
                                        {lesson.type === 'video' ? (
                                          <div className="relative w-24 h-16 bg-black rounded overflow-hidden">
                                            <video
                                              src={lesson.videoUrl}
                                              className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                              <Play className="w-6 h-6 text-white" />
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="w-16 h-16 bg-blue-500/20 rounded flex items-center justify-center">
                                            <FileText className="w-8 h-8 text-blue-500" />
                                          </div>
                                        )}
                                        <div className="flex-1">
                                          <p className="text-sm text-white">
                                            {lesson.type === 'video'
                                              ? 'Vídeo enviado'
                                              : 'Documento enviado'}
                                          </p>
                                          <p className="text-xs text-gray-500 truncate">
                                            {lesson.videoUrl || lesson.documentUrl}
                                          </p>
                                        </div>
                                        <button
                                          onClick={() =>
                                            triggerUpload(moduleIndex, lessonIndex)
                                          }
                                          className="px-3 py-1.5 bg-surface-hover text-gray-300 rounded text-xs hover:bg-gray-600"
                                        >
                                          Substituir
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        if (!lesson.id) {
                                          saveLesson(moduleIndex, lessonIndex).then(
                                            () =>
                                              triggerUpload(moduleIndex, lessonIndex)
                                          );
                                        } else {
                                          triggerUpload(moduleIndex, lessonIndex);
                                        }
                                      }}
                                      className="w-full border-2 border-dashed border-gray-600 rounded-lg p-4 text-center hover:border-brand-500 hover:bg-surface-hover transition-colors"
                                    >
                                      <Upload className="w-6 h-6 text-gray-500 mx-auto mb-2" />
                                      <p className="text-sm text-gray-400">
                                        Clique para fazer upload
                                      </p>
                                      <p className="text-xs text-gray-500 mt-1">
                                        {lesson.type === 'video'
                                          ? 'MP4, WebM (máx. 500MB)'
                                          : 'PDF, DOC, PPT (máx. 500MB)'}
                                      </p>
                                    </button>
                                  )}
                                </div>

                                {/* Materiais de Apoio */}
                                <div>
                                  <label className="block text-xs font-medium text-gray-400 mb-2">
                                    Materiais de Apoio (opcional)
                                  </label>

                                  <div className="space-y-2">
                                    {/* Lista de materiais existentes */}
                                    {lesson.supportMaterials && lesson.supportMaterials.length > 0 && (
                                      <div className="space-y-2">
                                        {lesson.supportMaterials.map((material, materialIndex) => (
                                          <div
                                            key={materialIndex}
                                            className="border border-gray-600 rounded-lg p-2 flex items-center gap-3"
                                          >
                                            {/* Thumbnail ou ícone */}
                                            {material.thumbnailUrl ? (
                                              <img
                                                src={material.thumbnailUrl}
                                                alt={material.fileName}
                                                className="w-10 h-14 object-cover rounded flex-shrink-0"
                                              />
                                            ) : (
                                              <div className="w-10 h-14 bg-green-500/20 rounded flex items-center justify-center flex-shrink-0">
                                                <FileText className="w-5 h-5 text-green-500" />
                                              </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                              <p className="text-xs text-white truncate">
                                                {material.fileName}
                                              </p>
                                              <p className="text-xs text-gray-500">
                                                {material.size ? `${(material.size / 1024 / 1024).toFixed(2)} MB` : ''}
                                              </p>
                                            </div>
                                            <button
                                              onClick={async (e) => {
                                                e.stopPropagation();
                                                if (lesson.id) {
                                                  try {
                                                    await api.admin.removeSupportMaterial(lesson.id, material.url);
                                                    const newMaterials = lesson.supportMaterials?.filter(
                                                      (_, i) => i !== materialIndex
                                                    ) || [];
                                                    updateLesson(moduleIndex, lessonIndex, {
                                                      supportMaterials: newMaterials
                                                    });
                                                  } catch (err) {
                                                    console.error('Erro ao remover material:', err);
                                                  }
                                                }
                                              }}
                                              className="p-1 text-gray-500 hover:text-red-500"
                                              title="Remover material"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* Botão para adicionar mais */}
                                    <button
                                      onClick={() => {
                                        if (!lesson.id) {
                                          saveLesson(moduleIndex, lessonIndex).then(
                                            () =>
                                              triggerUpload(moduleIndex, lessonIndex, 'support')
                                          );
                                        } else {
                                          triggerUpload(moduleIndex, lessonIndex, 'support');
                                        }
                                      }}
                                      className="w-full border border-dashed border-gray-600 rounded-lg p-3 text-center hover:border-green-500 hover:bg-surface-hover transition-colors"
                                    >
                                      <Upload className="w-5 h-5 text-gray-500 mx-auto mb-1" />
                                      <p className="text-xs text-gray-400">
                                        {lesson.supportMaterials && lesson.supportMaterials.length > 0
                                          ? 'Adicionar mais materiais'
                                          : 'Adicionar material de apoio'}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        PDF, DOC, PPT
                                      </p>
                                    </button>
                                  </div>
                                </div>

                                <div className="flex justify-end">
                                  <button
                                    onClick={() => {
                                      saveLesson(moduleIndex, lessonIndex);
                                      updateLesson(moduleIndex, lessonIndex, {
                                        isEditing: false,
                                      });
                                    }}
                                    className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm hover:bg-brand-600"
                                  >
                                    Salvar Aula
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={() => addLesson(moduleIndex)}
                          className="w-full py-2 border border-dashed border-gray-600 rounded-lg text-gray-400 hover:text-white hover:border-gray-500 text-sm flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Adicionar Aula
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {modules.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>Nenhum módulo adicionado</p>
                    <p className="text-sm">
                      Clique em &quot;Adicionar Módulo&quot; para começar
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {form.thumbnailUrl && (
            <div className="bg-surface-card rounded-xl border border-gray-800 p-4">
              <p className="text-sm font-medium text-gray-300 mb-3">
                Preview da Thumbnail
              </p>
              <img
                src={form.thumbnailUrl}
                alt="Thumbnail"
                className="w-full aspect-video object-cover rounded-lg"
              />
            </div>
          )}

          <div className="bg-surface-card rounded-xl border border-gray-800 p-4">
            <p className="text-sm font-medium text-gray-300 mb-3">Informações</p>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span
                  className={`font-medium ${
                    form.status === 'published'
                      ? 'text-green-500'
                      : form.status === 'archived'
                        ? 'text-gray-400'
                        : 'text-yellow-500'
                  }`}
                >
                  {form.status === 'published'
                    ? 'Publicado'
                    : form.status === 'archived'
                      ? 'Arquivado'
                      : 'Rascunho'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Módulos</span>
                <span className="text-white">{modules.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Aulas</span>
                <span className="text-white">
                  {modules.reduce((acc, m) => acc + m.lessons.length, 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Com conteúdo</span>
                <span className="text-white">
                  {modules.reduce(
                    (acc, m) =>
                      acc +
                      m.lessons.filter((l) => l.videoUrl || l.documentUrl).length,
                    0
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Com apoio</span>
                <span className="text-white">
                  {modules.reduce(
                    (acc, m) =>
                      acc +
                      m.lessons.filter((l) => l.supportMaterials && l.supportMaterials.length > 0).length,
                    0
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
