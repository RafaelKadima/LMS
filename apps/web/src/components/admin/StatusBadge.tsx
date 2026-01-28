'use client';

type Status = 'active' | 'inactive' | 'pending' | 'completed' | 'draft' | 'published' | 'archived';

interface StatusBadgeProps {
  status: Status | boolean | string;
  labels?: Record<string, string>;
}

const defaultLabels: Record<string, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
  pending: 'Pendente',
  completed: 'Concluído',
  draft: 'Rascunho',
  published: 'Publicado',
  archived: 'Arquivado',
  true: 'Ativo',
  false: 'Inativo',
};

const statusColors: Record<string, string> = {
  active: 'bg-green-500/10 text-green-500 border-green-500/20',
  inactive: 'bg-red-500/10 text-red-500 border-red-500/20',
  pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  completed: 'bg-green-500/10 text-green-500 border-green-500/20',
  draft: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  published: 'bg-brand-500/10 text-brand-500 border-brand-500/20',
  archived: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  true: 'bg-green-500/10 text-green-500 border-green-500/20',
  false: 'bg-red-500/10 text-red-500 border-red-500/20',
};

export function StatusBadge({ status, labels = {} }: StatusBadgeProps) {
  const statusKey = String(status);
  const label = labels[statusKey] || defaultLabels[statusKey] || statusKey;
  const colorClass = statusColors[statusKey] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${colorClass}`}
    >
      {label}
    </span>
  );
}
