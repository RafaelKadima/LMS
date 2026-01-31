'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/admin';
import { api } from '@/lib/api';
import { AlertTriangle, Search, X, UserPlus } from 'lucide-react';

export default function NewMeetingPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'meeting',
    scheduledAt: '',
    durationMinutes: 60,
    scope: 'broadcast',
    franchiseId: '',
    storeId: '',
    participantIds: [] as string[],
  });

  const [franchises, setFranchises] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    api.admin.getFranchises({ perPage: 100 }).then((r) => setFranchises(r.data));
    api.admin.getStores({ perPage: 100 }).then((r) => setStores(r.data));
  }, []);

  useEffect(() => {
    if (form.scope === 'manual' && userSearch.length >= 2) {
      const timer = setTimeout(() => {
        api.admin.getUsers({ search: userSearch, perPage: 10 }).then((r) => setSearchResults(r.data));
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [userSearch, form.scope]);

  const addParticipant = (user: any) => {
    if (!form.participantIds.includes(user.id)) {
      setForm((f) => ({ ...f, participantIds: [...f.participantIds, user.id] }));
      setUsers((u) => [...u, user]);
    }
    setUserSearch('');
    setSearchResults([]);
  };

  const removeParticipant = (userId: string) => {
    setForm((f) => ({ ...f, participantIds: f.participantIds.filter((id) => id !== userId) }));
    setUsers((u) => u.filter((user) => user.id !== userId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      const payload: any = {
        title: form.title,
        description: form.description || undefined,
        type: form.type,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        durationMinutes: form.durationMinutes,
        scope: form.scope,
      };

      if (form.scope === 'franchise') payload.franchiseId = form.franchiseId;
      if (form.scope === 'store') payload.storeId = form.storeId;
      if (form.scope === 'manual') payload.participantIds = form.participantIds;

      await api.meetings.create(payload);
      router.push('/admin/meetings');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar reunião');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredStores = form.scope === 'store' && form.franchiseId
    ? stores.filter((s) => s.franchiseId === form.franchiseId)
    : stores;

  return (
    <div>
      <PageHeader
        title="Nova Reunião"
        description="Agende uma nova reunião, seminário ou treinamento"
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Reuniões', href: '/admin/meetings' },
          { label: 'Nova' },
        ]}
      />

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Info banner */}
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-300 text-sm">
          As reuniões usam Jitsi Meet integrado. Gravação não está disponível nesta versão.
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1.5">Título *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            className="w-full px-4 py-2.5 bg-white/[0.06] border border-white/[0.08] rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20"
            placeholder="Ex: Reunião de Alinhamento Semanal"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1.5">Descrição</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="w-full px-4 py-2.5 bg-white/[0.06] border border-white/[0.08] rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 resize-none"
            placeholder="Descreva o objetivo da reunião..."
          />
        </div>

        {/* Type + Duration row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Tipo *</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/[0.06] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:border-brand-500/50"
            >
              <option value="meeting">Reunião</option>
              <option value="seminar">Seminário</option>
              <option value="training">Treinamento</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Duração (min) *</label>
            <input
              type="number"
              value={form.durationMinutes}
              onChange={(e) => setForm({ ...form, durationMinutes: parseInt(e.target.value) || 60 })}
              min={15}
              className="w-full px-4 py-2.5 bg-white/[0.06] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:border-brand-500/50"
            />
          </div>
        </div>

        {/* Date/Time */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1.5">Data e Hora *</label>
          <input
            type="datetime-local"
            value={form.scheduledAt}
            onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
            required
            className="w-full px-4 py-2.5 bg-white/[0.06] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:border-brand-500/50"
          />
        </div>

        {/* Scope */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1.5">Participantes *</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { value: 'broadcast', label: 'Todos', desc: 'Todos os usuários' },
              { value: 'franchise', label: 'Franquia', desc: 'Uma franquia' },
              { value: 'store', label: 'Loja', desc: 'Uma loja' },
              { value: 'manual', label: 'Manual', desc: 'Selecionar' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm({ ...form, scope: opt.value })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  form.scope === opt.value
                    ? 'border-brand-500/50 bg-brand-500/10 text-white'
                    : 'border-white/[0.08] bg-white/[0.03] text-white/50 hover:border-white/[0.15]'
                }`}
              >
                <p className="text-sm font-medium">{opt.label}</p>
                <p className="text-xs mt-0.5 opacity-60">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Franchise selector */}
        {form.scope === 'franchise' && (
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Franquia *</label>
            <select
              value={form.franchiseId}
              onChange={(e) => setForm({ ...form, franchiseId: e.target.value })}
              required
              className="w-full px-4 py-2.5 bg-white/[0.06] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:border-brand-500/50"
            >
              <option value="">Selecione...</option>
              {franchises.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Store selector */}
        {form.scope === 'store' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Franquia</label>
              <select
                value={form.franchiseId}
                onChange={(e) => setForm({ ...form, franchiseId: e.target.value, storeId: '' })}
                className="w-full px-4 py-2.5 bg-white/[0.06] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:border-brand-500/50"
              >
                <option value="">Todas as franquias</option>
                {franchises.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Loja *</label>
              <select
                value={form.storeId}
                onChange={(e) => setForm({ ...form, storeId: e.target.value })}
                required
                className="w-full px-4 py-2.5 bg-white/[0.06] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:border-brand-500/50"
              >
                <option value="">Selecione...</option>
                {filteredStores.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Manual participant selector */}
        {form.scope === 'manual' && (
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Buscar Participantes</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/[0.06] border border-white/[0.08] rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-brand-500/50"
                placeholder="Digite o nome ou email..."
              />
            </div>

            {/* Search results */}
            {searchResults.length > 0 && (
              <div className="mt-2 border border-white/[0.08] rounded-xl overflow-hidden bg-surface-card">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => addParticipant(user)}
                    disabled={form.participantIds.includes(user.id)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.04] transition-colors text-left disabled:opacity-40"
                  >
                    <UserPlus className="w-4 h-4 text-white/40" />
                    <div>
                      <p className="text-sm text-white">{user.name}</p>
                      <p className="text-xs text-white/40">{user.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Selected participants */}
            {users.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {users.map((user) => (
                  <span
                    key={user.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.06] border border-white/[0.08] rounded-lg text-sm text-white/70"
                  >
                    {user.name}
                    <button type="button" onClick={() => removeParticipant(user.id)} className="text-white/30 hover:text-red-400">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {form.participantIds.length === 0 && (
              <p className="text-xs text-white/30 mt-2">Nenhum participante selecionado</p>
            )}
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center gap-3 pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-brand-500 text-white rounded-xl font-medium text-sm hover:bg-brand-600 transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Criando...' : 'Criar Reunião'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 bg-white/[0.06] text-white/70 rounded-xl font-medium text-sm hover:bg-white/[0.1] transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
