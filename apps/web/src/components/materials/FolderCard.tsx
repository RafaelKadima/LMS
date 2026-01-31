'use client';

import { Folder, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface FolderCardProps {
  id: string;
  name: string;
  itemCount?: number;
  modifiedTime?: string;
}

export function FolderCard({ id, name, itemCount, modifiedTime }: FolderCardProps) {
  const displayName = name.replace(/^\d+-/, '').replace(/-/g, ' ');

  const formattedDate = modifiedTime
    ? new Date(modifiedTime).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <Link
      href={`/materials/${id}`}
      className={cn(
        'group block bg-surface-card rounded-xl border border-white/[0.06] p-5',
        'hover:border-brand-500/30 hover:bg-surface-hover transition-all duration-200'
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            'p-3 bg-yellow-500/[0.08] rounded-xl',
            'group-hover:bg-yellow-500/[0.15] transition-colors duration-200'
          )}
        >
          <Folder className="w-8 h-8 text-yellow-500" />
        </div>

        <div className="flex-1 min-w-0">
          <h3
            className={cn(
              'font-display text-lg font-semibold text-white/90',
              'group-hover:text-brand-500 transition-colors duration-200 truncate capitalize'
            )}
          >
            {displayName}
          </h3>

          <div className="flex items-center gap-3 mt-1 text-sm text-white/40">
            {itemCount !== undefined && (
              <span>{itemCount} {itemCount === 1 ? 'item' : 'itens'}</span>
            )}
            {formattedDate && (
              <>
                <span>&bull;</span>
                <span>Atualizado em {formattedDate}</span>
              </>
            )}
          </div>
        </div>

        <ChevronRight
          className={cn(
            'w-5 h-5 text-white/20',
            'group-hover:text-brand-500 transition-colors duration-200'
          )}
        />
      </div>
    </Link>
  );
}
