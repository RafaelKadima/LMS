'use client';

import { Download, Eye } from 'lucide-react';
import { FileTypeIcon, getFileTypeLabel, formatFileSize } from './FileTypeIcon';
import { cn } from '@/lib/utils';

interface FileCardProps {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  thumbnailUrl?: string;
  modifiedTime?: string;
  onPreview?: () => void;
  onDownload?: () => void;
}

export function FileCard({
  id,
  name,
  mimeType,
  size,
  thumbnailUrl,
  modifiedTime,
  onPreview,
  onDownload,
}: FileCardProps) {
  const canPreview =
    mimeType === 'application/pdf' ||
    mimeType.startsWith('image/') ||
    mimeType.startsWith('video/') ||
    mimeType.includes('google-apps');

  // Format date
  const formattedDate = modifiedTime
    ? new Date(modifiedTime).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
      })
    : null;

  return (
    <div
      className={cn(
        'group bg-surface-card rounded-xl border border-white/[0.06]',
        'hover:border-white/[0.12] transition-all duration-200 overflow-hidden'
      )}
    >
      {/* Thumbnail or Icon */}
      <div className="relative h-32 rounded-t-xl overflow-hidden bg-surface-dark flex items-center justify-center">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <FileTypeIcon mimeType={mimeType} className="w-16 h-16" />
        )}

        {/* Hover Actions */}
        <div
          className={cn(
            'absolute inset-0 bg-black/60 backdrop-blur-sm',
            'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
            'flex items-center justify-center gap-2'
          )}
        >
          {canPreview && onPreview && (
            <button
              onClick={onPreview}
              className={cn(
                'p-2 bg-white/10 backdrop-blur-md rounded-xl',
                'hover:bg-white/20 transition-colors'
              )}
              title="Visualizar"
            >
              <Eye className="w-5 h-5 text-white" />
            </button>
          )}
          {onDownload && (
            <button
              onClick={onDownload}
              className={cn(
                'p-2 bg-brand-500/90 backdrop-blur-md rounded-xl',
                'hover:bg-brand-500 transition-colors'
              )}
              title="Baixar"
            >
              <Download className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h4
          className="font-body text-sm font-medium text-white/90 truncate"
          title={name}
        >
          {name}
        </h4>

        <div className="flex items-center gap-2 mt-2 text-xs text-white/40">
          <span className="px-2 py-0.5 bg-white/[0.06] rounded-md font-body text-white/50">
            {getFileTypeLabel(mimeType)}
          </span>
          {size && <span className="font-body">{formatFileSize(size)}</span>}
          {formattedDate && <span className="font-body">• {formattedDate}</span>}
        </div>
      </div>
    </div>
  );
}
