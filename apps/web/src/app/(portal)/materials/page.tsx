'use client';

import { useState, useEffect } from 'react';
import { Search, FolderOpen, AlertCircle, Loader2 } from 'lucide-react';
import { FolderCard, FileCard, FilePreview } from '@/components/materials';
import { api } from '@/lib/api';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  thumbnailUrl?: string;
  webViewLink?: string;
  modifiedTime?: string;
  isFolder: boolean;
}

export default function MaterialsPage() {
  const [items, setItems] = useState<DriveFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DriveFile[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [previewFile, setPreviewFile] = useState<DriveFile | null>(null);

  useEffect(() => {
    fetchRootFolders();
  }, []);

  const fetchRootFolders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.drive.getRootFolders();
      setItems(data);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('Google Drive nao configurado. Entre em contato com o administrador.');
      } else {
        setError('Erro ao carregar materiais');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults(null);
      return;
    }

    setIsSearching(true);
    try {
      const results = await api.drive.search(searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
  };

  const handleDownload = async (file: DriveFile) => {
    try {
      await api.drive.downloadFile(file.id, file.name);
    } catch (err) {
      console.error('Download error:', err);
      alert('Erro ao baixar arquivo');
    }
  };

  const handlePreview = async (file: DriveFile) => {
    try {
      const previewUrl = await api.drive.getPreviewUrl(file.id);
      setPreviewFile({ ...file, webViewLink: previewUrl });
    } catch (err) {
      // Fallback to direct preview
      setPreviewFile(file);
    }
  };

  const folders = (searchResults || items).filter(item => item.isFolder);
  const files = (searchResults || items).filter(item => !item.isFolder);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Materiais de Apoio</h1>
          <p className="text-gray-400 mt-1">
            Acesse manuais, documentos e materiais de marketing
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Buscar arquivos..."
            className="w-full pl-10 pr-4 py-2.5 bg-surface-card border border-gray-700 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-brand-500"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            >
              &times;
            </button>
          )}
        </div>
        {searchResults && (
          <p className="mt-2 text-sm text-gray-500">
            {searchResults.length} resultado(s) para "{searchQuery}"
            <button onClick={clearSearch} className="ml-2 text-brand-500 hover:underline">
              Limpar
            </button>
          </p>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <p className="text-gray-400">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FolderOpen className="w-16 h-16 text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Nenhum material disponivel</h3>
          <p className="text-gray-500">
            Os materiais serao exibidos aqui quando forem adicionados pelo administrador.
          </p>
        </div>
      )}

      {/* Folders */}
      {!isLoading && !error && folders.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">
            {searchResults ? 'Pastas encontradas' : 'Pastas'}
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {folders.map((folder) => (
              <FolderCard
                key={folder.id}
                id={folder.id}
                name={folder.name}
                modifiedTime={folder.modifiedTime}
              />
            ))}
          </div>
        </div>
      )}

      {/* Files (only shown in search results) */}
      {!isLoading && !error && searchResults && files.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Arquivos encontrados</h2>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {files.map((file) => (
              <FileCard
                key={file.id}
                id={file.id}
                name={file.name}
                mimeType={file.mimeType}
                size={file.size}
                thumbnailUrl={file.thumbnailUrl}
                modifiedTime={file.modifiedTime}
                onPreview={() => handlePreview(file)}
                onDownload={() => handleDownload(file)}
              />
            ))}
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      <FilePreview
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        file={previewFile ? {
          id: previewFile.id,
          name: previewFile.name,
          mimeType: previewFile.mimeType,
          previewUrl: previewFile.webViewLink,
        } : null}
        onDownload={previewFile ? () => handleDownload(previewFile) : undefined}
      />
    </div>
  );
}
