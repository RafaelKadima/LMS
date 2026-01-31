'use client';

import { useState, useEffect } from 'react';
import { X, Download, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
      if (blobUrl) {
        window.URL.revokeObjectURL(blobUrl);
        setBlobUrl(null);
      }
    };
  }, [isOpen, file?.id]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const loadFileBlob = async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const url = await api.drive.getFileBlob(file.id, file.mimeType);
      setBlobUrl(url);
    } catch (err) {
      console.error('Error loading file:', err);
      setError('Erro ao carregar arquivo');
    } finally {
      setIsLoading(false);
    }
  };

  if (!file) return null;

  const isPdf = file.mimeType === 'application/pdf';
  const isImage = file.mimeType.startsWith('image/');
  const isVideo = file.mimeType.startsWith('video/');
  const isGoogleDoc = file.mimeType.includes('google-apps');

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="relative glass-strong rounded-2xl w-full max-w-5xl max-h-[95vh] sm:max-h-[90vh] mx-2 sm:mx-4 flex flex-col shadow-elevated"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3 min-w-0">
                <FileTypeIcon mimeType={file.mimeType} className="w-5 h-5 shrink-0" />
                <h3 className="text-base font-display font-semibold text-white truncate">
                  {file.name}
                </h3>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {onDownload && (
                  <button
                    onClick={onDownload}
                    className="flex items-center gap-2 px-3 py-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors text-sm font-medium"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Baixar</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 text-white/40 hover:text-white hover:bg-white/[0.06] rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4 min-h-[300px] sm:min-h-[400px]">
              {isLoading && (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <div className="w-10 h-10 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
                  <p className="text-white/40 text-sm">Carregando arquivo...</p>
                </div>
              )}

              {error && !isLoading && (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-white/40">
                  <FileTypeIcon mimeType={file.mimeType} className="w-16 h-16" />
                  <p className="text-sm">{error}</p>
                  {onDownload && (
                    <button
                      onClick={onDownload}
                      className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors text-sm font-medium"
                    >
                      <Download className="w-4 h-4" />
                      Baixar arquivo
                    </button>
                  )}
                </div>
              )}

              {!isLoading && !error && isImage && blobUrl && (
                <div className="flex items-center justify-center h-full">
                  <img
                    src={blobUrl}
                    alt={file.name}
                    className="max-w-full max-h-full object-contain rounded-xl"
                  />
                </div>
              )}

              {!isLoading && !error && isVideo && blobUrl && (
                <div className="flex items-center justify-center h-full">
                  <video
                    src={blobUrl}
                    controls
                    className="max-w-full max-h-full rounded-xl"
                  >
                    Seu navegador nao suporta video
                  </video>
                </div>
              )}

              {!isLoading && !error && isPdf && blobUrl && (
                <iframe
                  src={blobUrl}
                  className="w-full h-[500px] sm:h-[600px] rounded-xl border-0"
                  title={file.name}
                />
              )}

              {!isLoading && !error && isGoogleDoc && (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-white/40">
                  <FileTypeIcon mimeType={file.mimeType} className="w-16 h-16" />
                  <p className="text-sm">Documentos Google podem ser baixados como PDF</p>
                  {onDownload && (
                    <button
                      onClick={onDownload}
                      className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors text-sm font-medium"
                    >
                      <Download className="w-4 h-4" />
                      Baixar como PDF
                    </button>
                  )}
                </div>
              )}

              {!isLoading && !error && !isImage && !isVideo && !isPdf && !isGoogleDoc && (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-white/40">
                  <FileTypeIcon mimeType={file.mimeType} className="w-16 h-16" />
                  <p className="text-sm">Preview nao disponivel para este tipo de arquivo</p>
                  {onDownload && (
                    <button
                      onClick={onDownload}
                      className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors text-sm font-medium"
                    >
                      <Download className="w-4 h-4" />
                      Baixar arquivo
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
