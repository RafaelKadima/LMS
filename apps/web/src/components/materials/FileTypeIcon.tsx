'use client';

import {
  Folder,
  FileText,
  FileImage,
  FileVideo,
  FileSpreadsheet,
  Presentation,
  File,
  FileArchive,
  FileAudio,
} from 'lucide-react';

interface FileTypeIconProps {
  mimeType: string;
  isFolder?: boolean;
  className?: string;
}

export function FileTypeIcon({ mimeType, isFolder, className = 'w-6 h-6' }: FileTypeIconProps) {
  if (isFolder) {
    return <Folder className={`${className} text-yellow-500`} />;
  }

  // PDF
  if (mimeType === 'application/pdf') {
    return <FileText className={`${className} text-red-500`} />;
  }

  // Images
  if (mimeType.startsWith('image/')) {
    return <FileImage className={`${className} text-green-500`} />;
  }

  // Videos
  if (mimeType.startsWith('video/')) {
    return <FileVideo className={`${className} text-purple-500`} />;
  }

  // Audio
  if (mimeType.startsWith('audio/')) {
    return <FileAudio className={`${className} text-pink-500`} />;
  }

  // Spreadsheets
  if (
    mimeType.includes('spreadsheet') ||
    mimeType.includes('excel') ||
    mimeType === 'application/vnd.google-apps.spreadsheet'
  ) {
    return <FileSpreadsheet className={`${className} text-green-600`} />;
  }

  // Presentations
  if (
    mimeType.includes('presentation') ||
    mimeType.includes('powerpoint') ||
    mimeType === 'application/vnd.google-apps.presentation'
  ) {
    return <Presentation className={`${className} text-orange-500`} />;
  }

  // Documents
  if (
    mimeType.includes('document') ||
    mimeType.includes('word') ||
    mimeType === 'application/vnd.google-apps.document'
  ) {
    return <FileText className={`${className} text-blue-500`} />;
  }

  // Archives
  if (
    mimeType.includes('zip') ||
    mimeType.includes('rar') ||
    mimeType.includes('tar') ||
    mimeType.includes('compressed')
  ) {
    return <FileArchive className={`${className} text-gray-500`} />;
  }

  // Default
  return <File className={`${className} text-gray-400`} />;
}

export function getFileTypeLabel(mimeType: string): string {
  if (mimeType === 'application/pdf') return 'PDF';
  if (mimeType.startsWith('image/')) return 'Imagem';
  if (mimeType.startsWith('video/')) return 'Video';
  if (mimeType.startsWith('audio/')) return 'Audio';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'Planilha';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'Apresentacao';
  if (mimeType.includes('document') || mimeType.includes('word')) return 'Documento';
  if (mimeType.includes('zip') || mimeType.includes('rar')) return 'Arquivo';
  return 'Arquivo';
}

export function formatFileSize(bytes?: number): string {
  if (!bytes) return '';

  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}
