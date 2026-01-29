'use client';

import { Folder, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface FolderCardProps {
  id: string;
  name: string;
  itemCount?: number;
  modifiedTime?: string;
}

export function FolderCard({ id, name, itemCount, modifiedTime }: FolderCardProps) {
  // Remove prefix from display name (e.g., "00-global" -> "Global")
  const displayName = name.replace(/^\d+-/, '').replace(/-/g, ' ');

  // Format date
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
      className="group block bg-surface-card rounded-xl border border-gray-800 p-5 hover:border-brand-500/50 hover:bg-surface-hover transition-all"
    >
      <div className="flex items-start gap-4">
        <div className="p-3 bg-yellow-500/10 rounded-lg group-hover:bg-yellow-500/20 transition-colors">
          <Folder className="w-8 h-8 text-yellow-500" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-white group-hover:text-brand-500 transition-colors truncate capitalize">
            {displayName}
          </h3>

          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
            {itemCount !== undefined && (
              <span>{itemCount} {itemCount === 1 ? 'item' : 'itens'}</span>
            )}
            {formattedDate && (
              <>
                <span>•</span>
                <span>Atualizado em {formattedDate}</span>
              </>
            )}
          </div>
        </div>

        <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-brand-500 transition-colors" />
      </div>
    </Link>
  );
}
