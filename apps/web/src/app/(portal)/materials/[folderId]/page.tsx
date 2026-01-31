'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, FolderOpen, AlertCircle } from 'lucide-react';
import { FolderCard, FileCard, FilePreview, Breadcrumb } from '@/components/materials';
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

interface BreadcrumbItem {
  id: string;
  name: string;
}

export default function FolderPage() {
  const params = useParams();
  const router = useRouter();
  const folderId = params.folderId as string;

  const [items, setItems] = useState<DriveFile[]>([]);
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<DriveFile | null>(null);

  useEffect(() => {
    if (folderId) { fetchFolderContents(); fetchBreadcrumb(); }
  }, [folderId]);

  const fetchFolderContents = async () => {
    setIsLoading(true);
    setError(null);
    try { const data = await api.drive.getFolderContents(folderId); setItems(data); }
    catch (err: any) {
      if (err.response?.status === 403) setError('Voce nao tem permissao para acessar esta pasta');
      else if (err.response?.status === 404) setError('Pasta nao encontrada');
      else setError('Erro ao carregar conteudo da pasta');
    } finally { setIsLoading(false); }
  };

  const fetchBreadcrumb = async () => {
    try { const data = await api.drive.getBreadcrumb(folderId); setBreadcrumb(data.slice(1)); }
    catch (err) { console.error('Error fetching breadcrumb:', err); }
  };

  const handleDownload = async (file: DriveFile) => {
    try { await api.drive.downloadFile(file.id, file.name); }
    catch (err) { console.error('Download error:', err); alert('Erro ao baixar arquivo'); }
  };

  const handlePreview = async (file: DriveFile) => {
    try {
      const previewUrl = await api.drive.getPreviewUrl(file.id);
      setPreviewFile({ ...file, webViewLink: previewUrl });
    } catch (err) { setPreviewFile(file); }
  };

  const folders = items.filter(item => item.isFolder);
  const files = items.filter(item => !item.isFolder);

  const currentFolderName = breadcrumb.length > 0
    ? breadcrumb[breadcrumb.length - 1].name.replace(/^\d+-/, '').replace(/-/g, ' ')
    : 'Pasta';

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-4 font-body text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        <Breadcrumb items={breadcrumb} />

        <h1 className="text-2xl font-display font-bold text-white mt-4 capitalize tracking-tight">
          {currentFolderName}
        </h1>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <p className="text-white/50 font-body">{error}</p>
          <button
            onClick={() => router.push('/materials')}
            className="mt-4 px-4 py-2.5 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors font-medium"
          >
            Voltar para Materiais
          </button>
        </div>
      )}

      {!isLoading && !error && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FolderOpen className="w-16 h-16 text-white/20 mb-4" />
          <h3 className="text-lg font-display font-medium text-white/70 mb-2">Pasta vazia</h3>
          <p className="text-white/40 font-body">Esta pasta nao contem arquivos ou subpastas.</p>
        </div>
      )}

      {!isLoading && !error && folders.length > 0 && (
        <div>
          <h2 className="text-lg font-display font-semibold text-white mb-4">Pastas</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {folders.map((folder) => (
              <FolderCard key={folder.id} id={folder.id} name={folder.name} modifiedTime={folder.modifiedTime} />
            ))}
          </div>
        </div>
      )}

      {!isLoading && !error && files.length > 0 && (
        <div>
          <h2 className="text-lg font-display font-semibold text-white mb-4">Arquivos</h2>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {files.map((file) => (
              <FileCard
                key={file.id} id={file.id} name={file.name} mimeType={file.mimeType}
                size={file.size} thumbnailUrl={file.thumbnailUrl} modifiedTime={file.modifiedTime}
                onPreview={() => handlePreview(file)} onDownload={() => handleDownload(file)}
              />
            ))}
          </div>
        </div>
      )}

      <FilePreview
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        file={previewFile ? { id: previewFile.id, name: previewFile.name, mimeType: previewFile.mimeType, previewUrl: previewFile.webViewLink } : null}
        onDownload={previewFile ? () => handleDownload(previewFile) : undefined}
      />
    </div>
  );
}
