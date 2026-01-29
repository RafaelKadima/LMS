'use client';

import { Download, Eye } from 'lucide-react';
import { FileTypeIcon, getFileTypeLabel, formatFileSize } from './FileTypeIcon';

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
    <div className="group bg-surface-card rounded-xl border border-gray-800 hover:border-gray-700 transition-all overflow-hidden">
      {/* Thumbnail or Icon */}
      <div className="relative h-32 bg-surface-dark flex items-center justify-center">
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
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          {canPreview && onPreview && (
            <button
              onClick={onPreview}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              title="Visualizar"
            >
              <Eye className="w-5 h-5 text-white" />
            </button>
          )}
          {onDownload && (
            <button
              onClick={onDownload}
              className="p-2 bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors"
              title="Baixar"
            >
              <Download className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h4 className="text-sm font-medium text-white truncate" title={name}>
          {name}
        </h4>

        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
          <span className="px-2 py-0.5 bg-surface-hover rounded text-gray-400">
            {getFileTypeLabel(mimeType)}
          </span>
          {size && <span>{formatFileSize(size)}</span>}
          {formattedDate && <span>• {formattedDate}</span>}
        </div>
      </div>
    </div>
  );
}
