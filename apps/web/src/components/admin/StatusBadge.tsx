'use client';

import { cn } from '@/lib/utils';

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

const statusStyles: Record<string, { bg: string; text: string; dot: string }> = {
  active:    { bg: 'bg-emerald-500/[0.08]', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  inactive:  { bg: 'bg-red-500/[0.08]', text: 'text-red-400', dot: 'bg-red-400' },
  pending:   { bg: 'bg-amber-500/[0.08]', text: 'text-amber-400', dot: 'bg-amber-400' },
  completed: { bg: 'bg-emerald-500/[0.08]', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  draft:     { bg: 'bg-white/[0.04]', text: 'text-white/50', dot: 'bg-white/40' },
  published: { bg: 'bg-brand-500/[0.08]', text: 'text-brand-400', dot: 'bg-brand-400' },
  archived:  { bg: 'bg-white/[0.04]', text: 'text-white/40', dot: 'bg-white/30' },
  true:      { bg: 'bg-emerald-500/[0.08]', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  false:     { bg: 'bg-red-500/[0.08]', text: 'text-red-400', dot: 'bg-red-400' },
  scheduled: { bg: 'bg-blue-500/[0.08]', text: 'text-blue-400', dot: 'bg-blue-400' },
  live:      { bg: 'bg-emerald-500/[0.08]', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  ended:     { bg: 'bg-white/[0.04]', text: 'text-white/40', dot: 'bg-white/30' },
  cancelled: { bg: 'bg-red-500/[0.08]', text: 'text-red-400', dot: 'bg-red-400' },
};

const defaultStyle = { bg: 'bg-white/[0.04]', text: 'text-white/50', dot: 'bg-white/40' };

export function StatusBadge({ status, labels = {} }: StatusBadgeProps) {
  const statusKey = String(status);
  const label = labels[statusKey] || defaultLabels[statusKey] || statusKey;
  const style = statusStyles[statusKey] || defaultStyle;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium font-body border border-white/[0.06]',
        style.bg,
        style.text
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', style.dot)} />
      {label}
    </span>
  );
}
