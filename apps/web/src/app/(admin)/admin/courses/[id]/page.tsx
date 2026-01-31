'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
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
  Camera,
  Image as ImageIcon,
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

/** Componente para o admin escolher um frame do vídeo como thumbnail */
function ThumbnailPicker({
  videoUrl,
  currentThumbnail,
  onSave,
}: {
  videoUrl: string;
  currentThumbnail?: string;
  onSave: (blob: Blob) => Promise<void>;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Preview
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    canvas.toBlob(
      (blob) => {
        if (blob) setPreviewUrl(URL.createObjectURL(blob));
      },
      'image/jpeg',
      0.9,
    );
  }, [previewUrl]);

  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsSaving(true);
    canvas.toBlob(
      async (blob) => {
        if (blob) {
          try {
            await onSave(blob);
            setIsOpen(false);
          } catch (err) {
            console.error('Erro ao salvar thumbnail:', err);
          }
        }
        setIsSaving(false);
      },
      'image/jpeg',
      0.9,
    );
  };

  if (!isOpen) {
    return (
      <div className="mt-2">
        <div className="flex items-center gap-2">
          {currentThumbnail && (
            <img src={currentThumbnail} alt="Capa" className="w-16 h-10 object-cover rounded" />
          )}
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.06] text-white/70 rounded text-xs hover:bg-white/[0.1] transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
            {currentThumbnail ? 'Alterar capa' : 'Escolher capa'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 border border-brand-500/30 rounded-lg p-3 bg-white/[0.02] space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-white/70 flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5" />
          Escolher frame como capa
        </p>
        <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Video scrubber */}
      <div className="relative rounded overflow-hidden bg-black">
        <video
          ref={videoRef}
          src={videoUrl}
          crossOrigin="anonymous"
          muted
          playsInline
          preload="auto"
          className="w-full aspect-video object-contain"
          onLoadedMetadata={(e) => setDuration((e.target as HTMLVideoElement).duration)}
          onTimeUpdate={(e) => setCurrentTime((e.target as HTMLVideoElement).currentTime)}
        />
      </div>

      {/* Timeline slider */}
      <div className="space-y-1">
        <input
          type="range"
          min={0}
          max={duration || 1}
          step={0.1}
          value={currentTime}
          onChange={(e) => {
            const t = parseFloat(e.target.value);
            if (videoRef.current) videoRef.current.currentTime = t;
            setCurrentTime(t);
          }}
          className="w-full h-1.5 accent-brand-500 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-white/40">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={captureFrame}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.08] text-white rounded text-xs hover:bg-white/[0.12] transition-colors"
        >
          <Camera className="w-3.5 h-3.5" />
          Capturar frame
        </button>

        {previewUrl && (
          <>
            <img src={previewUrl} alt="Preview" className="w-16 h-10 object-cover rounded border border-white/10" />
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 text-white rounded text-xs hover:bg-brand-600 transition-colors disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Usar como capa
            </button>
          </>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
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

  const saveModule = async (moduleIndex: number): Promise<string | null> => {
    const module = modules[moduleIndex];
    try {
      if (module.id) {
        await api.admin.updateModule(module.id, {
          title: module.title,
          description: module.description,
          order: module.order,
        });
        return module.id;
      } else if (courseId) {
        const created = await api.admin.createModule({
          courseId,
          title: module.title,
          description: module.description,
          order: module.order,
        });
        updateModule(moduleIndex, { id: created.id });
        return created.id;
      }
      return null;
    } catch (err) {
      console.error('Erro ao salvar módulo:', err);
      return null;
    }
  };

  const saveLesson = async (moduleIndex: number, lessonIndex: number, overrideModuleId?: string | null): Promise<string | null> => {
    const module = modules[moduleIndex];
    const lesson = module.lessons[lessonIndex];
    const moduleId = overrideModuleId || module.id;
    try {
      if (lesson.id) {
        await api.admin.updateLesson(lesson.id, {
          title: lesson.title,
          description: lesson.description,
          type: lesson.type,
          durationSeconds: lesson.durationSeconds,
          order: lesson.order,
        });
        return lesson.id;
      } else if (moduleId) {
        const payload: any = {
          moduleId,
          title: lesson.title,
          type: lesson.type || 'video',
          order: lesson.order ?? 0,
        };
        if (lesson.description) payload.description = lesson.description;
        if (lesson.durationSeconds != null) payload.durationSeconds = Number(lesson.durationSeconds);
        const created = await api.admin.createLesson(payload);
        updateLesson(moduleIndex, lessonIndex, { id: created.id });
        return created.id;
      } else {
        setError('Salve o módulo antes de adicionar aulas');
        return null;
      }
    } catch (err: any) {
      console.error('Erro ao salvar aula:', err);
      console.error('Response data:', err.response?.data);
      console.error('Payload enviado:', { moduleId: module.id, title: lesson.title, type: lesson.type, order: lesson.order });
      setError(err.response?.data?.message?.join?.(', ') || err.response?.data?.message || 'Erro ao salvar aula');
      return null;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log('[Upload] handleFileUpload chamado', { file: file?.name, currentUploadLesson });
    if (!file || !currentUploadLesson) return;

    const { moduleIndex, lessonIndex } = currentUploadLesson;
    const lesson = modules[moduleIndex].lessons[lessonIndex];
    console.log('[Upload] Aula:', { id: lesson.id, title: lesson.title, type: lesson.type });

    if (!lesson.id) {
      console.error('[Upload] Aula sem ID - abortando');
      setError('Salve a aula primeiro antes de fazer upload');
      return;
    }

    const isVideo = file.type.startsWith('video/');
    console.log('[Upload] Iniciando upload', { isVideo, fileType: file.type, fileSize: file.size, uploadType });

    setUploadingLessonId(lesson.id);
    setUploadProgress(0);

    try {
      if (isVideo && uploadType === 'content') {
        // Upload de vídeo via presigned URL direto para R2
        setUploadProgress(5);

        // 1. Obter URL assinada do backend
        const presigned = await api.admin.getPresignedUrl({
          lessonId: lesson.id,
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
        });

        setUploadProgress(10);

        // 2. Upload direto para R2 com progresso real
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', presigned.uploadUrl, true);
          xhr.setRequestHeader('Content-Type', file.type);

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 80) + 10;
              setUploadProgress(percent);
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Upload falhou com status ${xhr.status}`));
            }
          };

          xhr.onerror = () => reject(new Error('Erro de rede durante upload'));
          xhr.send(file);
        });

        setUploadProgress(92);

        // 3. Notificar backend que upload concluiu
        await api.admin.completeUpload({
          lessonId: lesson.id,
          key: presigned.key,
          uploadId: presigned.uploadId,
        });

        setUploadProgress(100);
        // Recarregar a aula do servidor para obter a videoUrl completa do R2
        const updatedLesson = await api.admin.getLesson(lesson.id);
        updateLesson(moduleIndex, lessonIndex, { videoUrl: updatedLesson.videoUrl, type: 'video' });
      } else {
        // Upload de documentos/imagens via multipart (arquivos menores)
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => Math.min(prev + 10, 90));
        }, 200);

        try {
          const result = await api.admin.uploadLessonContent(lesson.id, file, uploadType);
          clearInterval(progressInterval);
          setUploadProgress(100);

          if (result.type === 'support') {
            const updatedLesson = await api.admin.getLesson(lesson.id);
            updateLesson(moduleIndex, lessonIndex, {
              supportMaterials: updatedLesson.supportMaterials || []
            });
          } else if (result.type === 'document') {
            updateLesson(moduleIndex, lessonIndex, { documentUrl: result.url, type: 'document' });
          } else if (result.type === 'image') {
            updateLesson(moduleIndex, lessonIndex, { thumbnailUrl: result.url });
          }
        } catch (err) {
          clearInterval(progressInterval);
          throw err;
        }
      }
    } catch (err: any) {
      console.error('Erro no upload:', err);
      setError(err.response?.data?.message || err.message || 'Erro ao fazer upload');
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
          className="flex items-center gap-2 px-4 py-2.5 text-white/50 hover:text-white transition-colors"
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário Principal */}
        <div className="col-span-2">
          <form onSubmit={handleSubmit}>
            <div className="glass rounded-2xl border border-white/[0.06] p-6 space-y-6">
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm flex items-center justify-between">
                  {error}
                  <button onClick={() => setError(null)}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors"
                  placeholder="Treinamento de Atendimento"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Descrição
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={4}
                  className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors resize-none"
                  placeholder="Descreva o conteúdo do curso..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    URL da Thumbnail
                  </label>
                  <input
                    type="url"
                    value={form.thumbnailUrl}
                    onChange={(e) =>
                      setForm({ ...form, thumbnailUrl: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value as any })
                    }
                    className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors"
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
                    className="w-4 h-4 rounded border-white/[0.08] bg-white/[0.04] text-brand-500"
                  />
                  <label htmlFor="isRequired" className="text-sm text-white/70">
                    Curso obrigatório
                  </label>
                </div>
              </div>

              {/* Seleção de Cargos */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Cargos que podem acessar
                </label>
                <p className="text-xs text-white/40 mb-3">
                  Deixe vazio para disponibilizar para todos os cargos
                </p>
                <div className="flex flex-wrap gap-3">
                  {['mecanico', 'atendente', 'gerente', 'proprietario'].map((cargo) => (
                    <label
                      key={cargo}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                        form.targetCargos.includes(cargo)
                          ? 'bg-brand-500/20 border-brand-500 text-brand-400'
                          : 'bg-white/[0.04] border-white/[0.08] text-white/50 hover:border-white/[0.1]'
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

              <div className="flex items-center gap-4 pt-4 border-t border-white/[0.06]">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-brand-500 text-white rounded-xl hover:bg-brand-600 font-medium disabled:opacity-50 transition-colors shadow-glow"
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
                  className="px-6 py-2.5 text-white/50 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </form>

          {/* Módulos e Aulas */}
          {!isNew && (
            <div className="mt-6 glass rounded-2xl border border-white/[0.06] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-display font-semibold tracking-tight text-white">
                  Módulos e Aulas
                </h2>
                <button
                  onClick={addModule}
                  className="flex items-center gap-2 px-4 py-2 bg-white/[0.06] text-white rounded-lg hover:bg-white/[0.08] text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Módulo
                </button>
              </div>

              <div className="space-y-4">
                {modules.map((module, moduleIndex) => (
                  <div
                    key={module.id || moduleIndex}
                    className="bg-white/[0.04] rounded-lg border border-white/[0.08]"
                  >
                    {/* Header do Módulo */}
                    <div className="flex items-center gap-3 p-4">
                      <GripVertical className="w-5 h-5 text-white/40 cursor-grab" />
                      <button
                        onClick={() =>
                          updateModule(moduleIndex, {
                            isExpanded: !module.isExpanded,
                          })
                        }
                        className="text-white/50 hover:text-white"
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
                      <span className="text-xs text-white/40">
                        {module.lessons.length} aulas
                      </span>
                      <button
                        onClick={() => removeModule(moduleIndex)}
                        className="p-1 text-white/40 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Aulas */}
                    {module.isExpanded && (
                      <div className="border-t border-white/[0.08] p-4 space-y-3">
                        {module.lessons.map((lesson, lessonIndex) => (
                          <div
                            key={lesson.id || lessonIndex}
                            className="bg-white/[0.06] rounded-lg border border-white/[0.1] overflow-hidden"
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
                              <GripVertical className="w-4 h-4 text-white/40 cursor-grab" />
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
                              <span className="text-xs text-white/40">
                                {formatDuration(lesson.durationSeconds)}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeLesson(moduleIndex, lessonIndex);
                                }}
                                className="p-1 text-white/40 hover:text-red-500"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Painel de edição expandido */}
                            {lesson.isEditing && (
                              <div className="border-t border-white/[0.1] p-4 space-y-4 bg-white/[0.04]">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-xs font-medium text-white/50 mb-1">
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
                                      className="w-full px-3 py-2 bg-white/[0.06] border border-white/[0.1] rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-white/50 mb-1">
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
                                      className="w-full px-3 py-2 bg-white/[0.06] border border-white/[0.1] rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors"
                                    >
                                      <option value="video">Vídeo</option>
                                      <option value="document">Documento</option>
                                    </select>
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-white/50 mb-1">
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
                                    className="w-full px-3 py-2 bg-white/[0.06] border border-white/[0.1] rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors resize-none"
                                    placeholder="Descrição da aula..."
                                  />
                                </div>

                                {/* Upload de conteúdo */}
                                <div>
                                  <label className="block text-xs font-medium text-white/50 mb-2">
                                    Conteúdo da Aula
                                  </label>

                                  {uploadingLessonId === lesson.id ? (
                                    <div className="border border-white/[0.1] rounded-lg p-4">
                                      <div className="flex items-center gap-3 mb-2">
                                        <Loader2 className="w-5 h-5 text-brand-500 animate-spin" />
                                        <span className="text-sm text-white/70">
                                          Enviando arquivo...
                                        </span>
                                      </div>
                                      <div className="w-full bg-white/[0.06] rounded-full h-2 overflow-hidden">
                                        <div
                                          className="bg-brand-500 h-full transition-all duration-300"
                                          style={{ width: `${uploadProgress}%` }}
                                        />
                                      </div>
                                    </div>
                                  ) : lesson.videoUrl || lesson.documentUrl ? (
                                    <div className="border border-white/[0.1] rounded-lg p-3">
                                      <div className="flex items-center gap-3">
                                        {lesson.type === 'video' ? (
                                          <div className="relative w-24 h-16 bg-black rounded overflow-hidden">
                                            <video
                                              src={lesson.videoUrl}
                                              className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
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
                                          <p className="text-xs text-white/40 truncate">
                                            {lesson.videoUrl || lesson.documentUrl}
                                          </p>
                                        </div>
                                        <button
                                          onClick={() =>
                                            triggerUpload(moduleIndex, lessonIndex)
                                          }
                                          className="px-3 py-1.5 bg-white/[0.06] text-white/70 rounded text-xs hover:bg-white/[0.08]"
                                        >
                                          Substituir
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={async () => {
                                        // Garantir que o módulo existe na API
                                        const mod = modules[moduleIndex];
                                        let currentModuleId: string | null = mod.id || null;
                                        if (!currentModuleId) {
                                          if (!courseId) {
                                            setError('Salve o curso primeiro');
                                            return;
                                          }
                                          currentModuleId = await saveModule(moduleIndex);
                                          if (!currentModuleId) {
                                            setError('Erro ao salvar módulo');
                                            return;
                                          }
                                        }
                                        // Garantir que a aula existe na API
                                        if (!lesson.id) {
                                          const savedId = await saveLesson(moduleIndex, lessonIndex, currentModuleId);
                                          if (!savedId) return;
                                        }
                                        triggerUpload(moduleIndex, lessonIndex);
                                      }}
                                      className="w-full border-2 border-dashed border-white/[0.1] rounded-lg p-4 text-center hover:border-brand-500 hover:bg-white/[0.06] transition-colors"
                                    >
                                      <Upload className="w-6 h-6 text-white/40 mx-auto mb-2" />
                                      <p className="text-sm text-white/50">
                                        Clique para fazer upload
                                      </p>
                                      <p className="text-xs text-white/40 mt-1">
                                        {lesson.type === 'video'
                                          ? 'MP4, WebM (máx. 500MB)'
                                          : 'PDF, DOC, PPT (máx. 500MB)'}
                                      </p>
                                    </button>
                                  )}
                                </div>

                                {/* Thumbnail Picker - apenas para vídeos já enviados */}
                                {lesson.type === 'video' && lesson.videoUrl && lesson.id && (
                                  <div>
                                    <label className="block text-xs font-medium text-white/50 mb-1">
                                      Capa da Aula
                                    </label>
                                    <ThumbnailPicker
                                      videoUrl={lesson.videoUrl}
                                      currentThumbnail={lesson.thumbnailUrl}
                                      onSave={async (blob) => {
                                        const thumbFile = new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' });
                                        const result = await api.admin.uploadLessonContent(lesson.id!, thumbFile);
                                        if (result.type === 'image') {
                                          updateLesson(moduleIndex, lessonIndex, { thumbnailUrl: result.url });
                                        }
                                      }}
                                    />
                                  </div>
                                )}

                                {/* Materiais de Apoio */}
                                <div>
                                  <label className="block text-xs font-medium text-white/50 mb-2">
                                    Materiais de Apoio (opcional)
                                  </label>

                                  <div className="space-y-2">
                                    {/* Lista de materiais existentes */}
                                    {lesson.supportMaterials && lesson.supportMaterials.length > 0 && (
                                      <div className="space-y-2">
                                        {lesson.supportMaterials.map((material, materialIndex) => (
                                          <div
                                            key={materialIndex}
                                            className="border border-white/[0.1] rounded-lg p-2 flex items-center gap-3"
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
                                              <p className="text-xs text-white/40">
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
                                              className="p-1 text-white/40 hover:text-red-500"
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
                                      className="w-full border border-dashed border-white/[0.1] rounded-lg p-3 text-center hover:border-green-500 hover:bg-white/[0.06] transition-colors"
                                    >
                                      <Upload className="w-5 h-5 text-white/40 mx-auto mb-1" />
                                      <p className="text-xs text-white/50">
                                        {lesson.supportMaterials && lesson.supportMaterials.length > 0
                                          ? 'Adicionar mais materiais'
                                          : 'Adicionar material de apoio'}
                                      </p>
                                      <p className="text-xs text-white/40">
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
                          className="w-full py-2 border border-dashed border-white/[0.1] rounded-lg text-white/50 hover:text-white hover:border-white/[0.2] text-sm flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Adicionar Aula
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {modules.length === 0 && (
                  <div className="text-center py-8 text-white/40">
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
            <div className="glass rounded-2xl border border-white/[0.06] p-4">
              <p className="text-sm font-medium text-white/70 mb-3">
                Preview da Thumbnail
              </p>
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
                <span
                  className={`font-medium ${
                    form.status === 'published'
                      ? 'text-green-500'
                      : form.status === 'archived'
                        ? 'text-white/50'
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
                <span className="text-white/40">Módulos</span>
                <span className="text-white">{modules.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Aulas</span>
                <span className="text-white">
                  {modules.reduce((acc, m) => acc + m.lessons.length, 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Com conteúdo</span>
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
                <span className="text-white/40">Com apoio</span>
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
