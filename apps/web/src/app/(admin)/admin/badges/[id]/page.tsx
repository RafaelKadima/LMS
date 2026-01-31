'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Save, ArrowLeft, Loader2, Award, HelpCircle } from 'lucide-react';
import { PageHeader } from '@/components/admin';
import { api } from '@/lib/api';

// Tipos de critérios suportados
const CRITERIA_TYPES = [
  { value: '', label: 'Sem critério automático (concessão manual)' },
  { value: 'courses_completed', label: 'Completar X cursos' },
  { value: 'specific_course', label: 'Completar curso específico' },
  { value: 'lessons_watched', label: 'Assistir X aulas' },
  { value: 'first_course', label: 'Completar primeiro curso' },
  { value: 'all_required', label: 'Completar todos cursos obrigatórios' },
];

interface BadgeForm {
  name: string;
  description: string;
  imageUrl: string;
  points: number;
  criteriaType: string;
  criteriaValue: number;
  criteriaCourseId: string;
}

interface Course {
  id: string;
  title: string;
}

export default function BadgeFormPage() {
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === 'new';
  const badgeId = isNew ? null : (params.id as string);

  const [form, setForm] = useState<BadgeForm>({
    name: '',
    description: '',
    imageUrl: '',
    points: 10,
    criteriaType: '',
    criteriaValue: 1,
    criteriaCourseId: '',
  });
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Carregar lista de cursos para o seletor
    const fetchCourses = async () => {
      try {
        const response = await api.admin.getCourses({ perPage: 100 });
        setCourses(response.data || []);
      } catch (err) {
        console.error('Erro ao carregar cursos:', err);
      }
    };
    fetchCourses();

    if (badgeId) {
      const fetchBadge = async () => {
        try {
          const badge = await api.admin.getBadge(badgeId);
          const criteria = badge.criteriaJson || {};
          setForm({
            name: badge.name,
            description: badge.description || '',
            imageUrl: badge.imageUrl || '',
            points: badge.points,
            criteriaType: criteria.type || '',
            criteriaValue: criteria.value || 1,
            criteriaCourseId: criteria.courseId || '',
          });
        } catch (err) {
          setError('Erro ao carregar badge');
        } finally {
          setIsLoading(false);
        }
      };
      fetchBadge();
    }
  }, [badgeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      // Montar o criteriaJson baseado no tipo selecionado
      let criteriaJson: any = {};

      if (form.criteriaType) {
        criteriaJson.type = form.criteriaType;

        if (form.criteriaType === 'courses_completed' || form.criteriaType === 'lessons_watched') {
          criteriaJson.value = form.criteriaValue;
        }

        if (form.criteriaType === 'specific_course') {
          criteriaJson.courseId = form.criteriaCourseId;
        }
      }

      const payload = {
        name: form.name,
        description: form.description,
        imageUrl: form.imageUrl,
        points: form.points,
        criteriaJson,
      };

      if (isNew) {
        await api.admin.createBadge(payload);
      } else {
        await api.admin.updateBadge(badgeId!, payload);
      }
      router.push('/admin/badges');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao salvar badge');
    } finally {
      setIsSaving(false);
    }
  };

  // Texto de ajuda baseado no critério selecionado
  const getCriteriaHelp = () => {
    switch (form.criteriaType) {
      case 'courses_completed':
        return 'O badge será concedido automaticamente quando o aluno completar a quantidade de cursos especificada.';
      case 'specific_course':
        return 'O badge será concedido automaticamente quando o aluno completar o curso selecionado.';
      case 'lessons_watched':
        return 'O badge será concedido automaticamente quando o aluno assistir a quantidade de aulas especificada.';
      case 'first_course':
        return 'O badge será concedido automaticamente quando o aluno completar seu primeiro curso.';
      case 'all_required':
        return 'O badge será concedido automaticamente quando o aluno completar todos os cursos marcados como obrigatórios.';
      default:
        return 'Sem critério automático. O badge só pode ser concedido manualmente pelo administrador.';
    }
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
        title={isNew ? 'Novo Badge' : 'Editar Badge'}
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Badges', href: '/admin/badges' },
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

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="glass rounded-2xl border border-white/[0.06] p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
              {error}
            </div>
          )}

          {/* Preview */}
          <div className="flex items-center gap-4 p-4 bg-white/[0.04] rounded-lg">
            <div className="w-16 h-16 bg-white/[0.06] rounded-xl flex items-center justify-center">
              {form.imageUrl ? (
                <img src={form.imageUrl} alt="Preview" className="w-12 h-12 object-contain" />
              ) : (
                <Award className="w-8 h-8 text-brand-500" />
              )}
            </div>
            <div>
              <p className="text-white font-medium">{form.name || 'Nome do Badge'}</p>
              <p className="text-white/50 text-sm">{form.description || 'Descrição do badge'}</p>
              <p className="text-brand-500 text-sm font-medium mt-1">{form.points} pontos</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Nome *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors"
              placeholder="Ex: Primeiro Curso Concluído"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Descrição</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors resize-none"
              placeholder="Descreva como conquistar este badge"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">URL da Imagem</label>
              <input
                type="url"
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Pontos *</label>
              <input
                type="number"
                value={form.points}
                onChange={(e) => setForm({ ...form, points: parseInt(e.target.value) || 0 })}
                required
                min={0}
                className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors"
              />
            </div>
          </div>

          {/* Seção de Critérios de Gamificação */}
          <div className="border-t border-white/[0.06] pt-6">
            <h3 className="text-lg font-display font-medium tracking-tight text-white mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-brand-500" />
              Critério de Concessão Automática
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Quando conceder este badge?
                </label>
                <select
                  value={form.criteriaType}
                  onChange={(e) => setForm({ ...form, criteriaType: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors"
                >
                  {CRITERIA_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Campo de valor numérico para cursos/aulas */}
              {(form.criteriaType === 'courses_completed' || form.criteriaType === 'lessons_watched') && (
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    {form.criteriaType === 'courses_completed' ? 'Quantidade de cursos' : 'Quantidade de aulas'}
                  </label>
                  <input
                    type="number"
                    value={form.criteriaValue}
                    onChange={(e) => setForm({ ...form, criteriaValue: parseInt(e.target.value) || 1 })}
                    min={1}
                    className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors"
                  />
                </div>
              )}

              {/* Seletor de curso específico */}
              {form.criteriaType === 'specific_course' && (
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Selecione o curso</label>
                  <select
                    value={form.criteriaCourseId}
                    onChange={(e) => setForm({ ...form, criteriaCourseId: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors"
                  >
                    <option value="">Selecione um curso...</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Ajuda contextual */}
              <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <HelpCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-300">{getCriteriaHelp()}</p>
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
              {isSaving ? 'Salvando...' : 'Salvar'}
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
    </div>
  );
}
