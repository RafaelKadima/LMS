'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2, Image, Video } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface MediaUploadProps {
  value?: string;
  onChange: (url: string | null) => void;
  mediaType: 'logo' | 'background';
  accept?: string;
  maxSize?: number; // em MB
  label?: string;
  description?: string;
}

export function MediaUpload({
  value,
  onChange,
  mediaType,
  accept = 'image/*,video/*',
  maxSize = 50,
  label,
  description,
}: MediaUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isVideo = value?.includes('.mp4') || value?.includes('.webm') || value?.includes('.mov');

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamanho
    if (file.size > maxSize * 1024 * 1024) {
      setError(`Arquivo muito grande. Máximo: ${maxSize}MB`);
      return;
    }

    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simular progresso (já que o upload direto não fornece progresso)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const publicUrl = await api.admin.uploadSettingsMedia(file, mediaType);

      clearInterval(progressInterval);
      setUploadProgress(100);
      onChange(publicUrl);
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer upload');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }

    // Limpar input para permitir reupload do mesmo arquivo
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    onChange(null);
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium font-body text-white/60">
          {label}
        </label>
      )}
      {description && (
        <p className="text-sm font-body text-white/30">{description}</p>
      )}

      {/* Preview */}
      {value && !isUploading && (
        <div className="glass relative group rounded-lg overflow-hidden border border-white/[0.06]">
          {isVideo ? (
            <video
              src={value}
              className="w-full h-48 object-cover"
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <img
              src={value}
              alt="Preview"
              className="w-full h-48 object-cover"
            />
          )}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-4 py-2.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors font-body font-medium min-h-[44px]"
            >
              Trocar
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors min-h-[44px]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="absolute top-2 left-2">
            {isVideo ? (
              <span className="flex items-center gap-1 px-2 py-1 bg-black/50 backdrop-blur-sm rounded text-xs text-white/80 font-body">
                <Video className="w-3 h-3" /> Vídeo
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2 py-1 bg-black/50 backdrop-blur-sm rounded text-xs text-white/80 font-body">
                <Image className="w-3 h-3" /> Imagem
              </span>
            )}
          </div>
        </div>
      )}

      {/* Upload Area */}
      {!value && !isUploading && (
        <div
          onClick={() => inputRef.current?.click()}
          className={cn(
            'glass border-2 border-dashed border-white/[0.08] rounded-lg p-8 sm:p-10 text-center cursor-pointer',
            'hover:border-brand-500/40 hover:bg-white/[0.02] transition-all duration-200',
            'min-h-[120px] flex flex-col items-center justify-center'
          )}
        >
          <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center mb-3">
            <Upload className="w-5 h-5 text-white/40" />
          </div>
          <p className="text-white/50 font-body">
            Clique para fazer upload ou arraste o arquivo
          </p>
          <p className="text-sm text-white/25 font-body mt-1">
            {mediaType === 'logo' ? 'PNG, JPG ou SVG' : 'PNG, JPG, MP4 ou WebM'} (máx. {maxSize}MB)
          </p>
        </div>
      )}

      {/* Uploading State */}
      {isUploading && (
        <div className="glass border border-white/[0.06] rounded-lg p-8 text-center">
          <Loader2 className="w-10 h-10 text-brand-500 mx-auto mb-3 animate-spin" />
          <p className="text-white/50 font-body mb-3">Enviando arquivo...</p>
          <div className="w-full bg-white/[0.04] rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-sm text-white/30 font-body mt-2">{uploadProgress}%</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-red-400 font-body">{error}</p>
      )}

      {/* Hidden Input */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
