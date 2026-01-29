'use client';

import { useState, useEffect } from 'react';
import { X, Download, Loader2 } from 'lucide-react';
import { FileTypeIcon } from './FileTypeIcon';
import { api } from '@/lib/api';

interface FilePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  file: {
    id: string;
    name: string;
    mimeType: string;
    previewUrl?: string;
  } | null;
  onDownload?: () => void;
}

export function FilePreview({ isOpen, onClose, file, onDownload }: FilePreviewProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && file) {
      loadFileBlob();
    }

    return () => {
      // Cleanup blob URL when modal closes
      if (blobUrl) {
        window.URL.revokeObjectURL(blobUrl);
        setBlobUrl(null);
      }
    };
  }, [isOpen, file?.id]);

  const loadFileBlob = async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const url = await api.drive.getFileBlob(file.id);
      setBlobUrl(url);
    } catch (err) {
      console.error('Error loading file:', err);
      setError('Erro ao carregar arquivo');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !file) return null;

  const isPdf = file.mimeType === 'application/pdf';
  const isImage = file.mimeType.startsWith('image/');
  const isVideo = file.mimeType.startsWith('video/');
  const isGoogleDoc = file.mimeType.includes('google-apps');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-surface-card rounded-xl border border-gray-800 w-full max-w-5xl max-h-[90vh] mx-4 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <FileTypeIcon mimeType={file.mimeType} className="w-6 h-6" />
            <h3 className="text-lg font-semibold text-white truncate max-w-md">
              {file.name}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {onDownload && (
              <button
                onClick={onDownload}
                className="flex items-center gap-2 px-3 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
              >
                <Download className="w-4 h-4" />
                Baixar
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-surface-hover rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 min-h-[400px]">
          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
              <p className="text-gray-400">Carregando arquivo...</p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400">
              <FileTypeIcon mimeType={file.mimeType} className="w-20 h-20" />
              <p>{error}</p>
              {onDownload && (
                <button
                  onClick={onDownload}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Baixar arquivo
                </button>
              )}
            </div>
          )}

          {/* Image Preview */}
          {!isLoading && !error && isImage && blobUrl && (
            <div className="flex items-center justify-center h-full">
              <img
                src={blobUrl}
                alt={file.name}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
          )}

          {/* Video Preview */}
          {!isLoading && !error && isVideo && blobUrl && (
            <div className="flex items-center justify-center h-full">
              <video
                src={blobUrl}
                controls
                className="max-w-full max-h-full rounded-lg"
              >
                Seu navegador nao suporta video
              </video>
            </div>
          )}

          {/* PDF Preview */}
          {!isLoading && !error && isPdf && blobUrl && (
            <iframe
              src={blobUrl}
              className="w-full h-[600px] rounded-lg border-0"
              title={file.name}
            />
          )}

          {/* Google Docs - Download only since we can't preview */}
          {!isLoading && !error && isGoogleDoc && (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400">
              <FileTypeIcon mimeType={file.mimeType} className="w-20 h-20" />
              <p>Documentos Google podem ser baixados como PDF</p>
              {onDownload && (
                <button
                  onClick={onDownload}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Baixar como PDF
                </button>
              )}
            </div>
          )}

          {/* Unsupported format */}
          {!isLoading && !error && !isImage && !isVideo && !isPdf && !isGoogleDoc && (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400">
              <FileTypeIcon mimeType={file.mimeType} className="w-20 h-20" />
              <p>Preview nao disponivel para este tipo de arquivo</p>
              {onDownload && (
                <button
                  onClick={onDownload}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Baixar arquivo
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
