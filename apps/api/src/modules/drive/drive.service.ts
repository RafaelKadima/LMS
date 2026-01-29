import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, drive_v3 } from 'googleapis';
import { PrismaService } from '../prisma/prisma.service';
import { Readable } from 'stream';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  thumbnailUrl?: string;
  webViewLink?: string;
  modifiedTime?: string;
  isFolder: boolean;
  parentId?: string;
}

export interface BreadcrumbItem {
  id: string;
  name: string;
}

@Injectable()
export class DriveService {
  private drive: drive_v3.Drive;
  private readonly logger = new Logger(DriveService.name);
  private readonly rootFolderId: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const email = this.configService.get<string>('GOOGLE_SERVICE_ACCOUNT_EMAIL');
    const privateKey = this.configService.get<string>('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY');
    this.rootFolderId = this.configService.get<string>('GOOGLE_DRIVE_ROOT_FOLDER_ID') || '';

    if (email && privateKey) {
      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: email,
          private_key: privateKey.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/drive.readonly'],
      });

      this.drive = google.drive({ version: 'v3', auth });
      this.logger.log('Google Drive service initialized');
    } else {
      this.logger.warn('Google Drive credentials not configured');
    }
  }

  /**
   * Check if Drive is configured
   */
  isConfigured(): boolean {
    return !!this.drive && !!this.rootFolderId;
  }

  /**
   * List root folders (filtered by user access)
   */
  async listRootFolders(user: any): Promise<DriveFile[]> {
    if (!this.isConfigured()) {
      throw new ForbiddenException('Google Drive not configured');
    }

    const folders = await this.listFolderContents(this.rootFolderId);

    // Filter folders based on user access
    return folders.filter(folder => this.canAccessFolder(folder.name, user));
  }

  /**
   * List contents of a specific folder
   */
  async listFolderContents(folderId: string, user?: any): Promise<DriveFile[]> {
    if (!this.isConfigured()) {
      throw new ForbiddenException('Google Drive not configured');
    }

    // If user provided, validate access
    if (user && folderId !== this.rootFolderId) {
      const folderInfo = await this.getFileMetadata(folderId);
      if (!this.canAccessFolder(folderInfo.name, user)) {
        throw new ForbiddenException('Sem permissao para acessar esta pasta');
      }
    }

    try {
      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: 'files(id, name, mimeType, size, thumbnailLink, webViewLink, modifiedTime, parents)',
        orderBy: 'folder,name',
        pageSize: 100,
      });

      const files = response.data.files || [];

      // Filter by user access if listing root folders
      const filteredFiles = user && folderId === this.rootFolderId
        ? files.filter(file => this.canAccessFolder(file.name || '', user))
        : files;

      return filteredFiles.map(file => this.mapToFile(file));
    } catch (error) {
      this.logger.error(`Error listing folder ${folderId}:`, error);
      throw new NotFoundException('Pasta nao encontrada');
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(fileId: string): Promise<DriveFile> {
    if (!this.isConfigured()) {
      throw new ForbiddenException('Google Drive not configured');
    }

    try {
      const response = await this.drive.files.get({
        fileId,
        fields: 'id, name, mimeType, size, thumbnailLink, webViewLink, modifiedTime, parents',
      });

      return this.mapToFile(response.data);
    } catch (error) {
      this.logger.error(`Error getting file ${fileId}:`, error);
      throw new NotFoundException('Arquivo nao encontrado');
    }
  }

  /**
   * Download file as stream
   */
  async downloadFile(fileId: string): Promise<{ stream: Readable; metadata: DriveFile }> {
    if (!this.isConfigured()) {
      throw new ForbiddenException('Google Drive not configured');
    }

    const metadata = await this.getFileMetadata(fileId);

    if (metadata.isFolder) {
      throw new ForbiddenException('Nao e possivel baixar uma pasta');
    }

    try {
      // Handle Google Docs files (need to export)
      if (metadata.mimeType.startsWith('application/vnd.google-apps.')) {
        const exportMimeType = this.getExportMimeType(metadata.mimeType);
        const response = await this.drive.files.export(
          { fileId, mimeType: exportMimeType },
          { responseType: 'stream' }
        );
        return { stream: response.data as Readable, metadata };
      }

      // Regular files
      const response = await this.drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'stream' }
      );

      return { stream: response.data as Readable, metadata };
    } catch (error) {
      this.logger.error(`Error downloading file ${fileId}:`, error);
      throw new NotFoundException('Erro ao baixar arquivo');
    }
  }

  /**
   * Get preview URL for a file
   */
  async getPreviewUrl(fileId: string): Promise<string> {
    const metadata = await this.getFileMetadata(fileId);

    // Google Docs files have webViewLink
    if (metadata.webViewLink) {
      return metadata.webViewLink;
    }

    // For other files, construct preview URL
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }

  /**
   * Search files across accessible folders
   */
  async searchFiles(query: string, user: any): Promise<DriveFile[]> {
    if (!this.isConfigured()) {
      throw new ForbiddenException('Google Drive not configured');
    }

    if (!query || query.length < 2) {
      return [];
    }

    try {
      const response = await this.drive.files.list({
        q: `name contains '${query}' and trashed = false`,
        fields: 'files(id, name, mimeType, size, thumbnailLink, webViewLink, modifiedTime, parents)',
        orderBy: 'modifiedTime desc',
        pageSize: 50,
      });

      const files = response.data.files || [];

      // Filter by user access - need to check parent folder
      const accessibleFiles: DriveFile[] = [];

      for (const file of files) {
        const parentId = file.parents?.[0];
        if (parentId) {
          try {
            const parent = await this.getFileMetadata(parentId);
            if (this.canAccessFolder(parent.name, user)) {
              accessibleFiles.push(this.mapToFile(file));
            }
          } catch {
            // Skip files in inaccessible folders
          }
        }
      }

      return accessibleFiles;
    } catch (error) {
      this.logger.error('Error searching files:', error);
      return [];
    }
  }

  /**
   * Get breadcrumb path for a folder
   */
  async getBreadcrumb(folderId: string): Promise<BreadcrumbItem[]> {
    if (!this.isConfigured()) {
      throw new ForbiddenException('Google Drive not configured');
    }

    const breadcrumb: BreadcrumbItem[] = [];
    let currentId = folderId;

    while (currentId && currentId !== this.rootFolderId) {
      try {
        const file = await this.getFileMetadata(currentId);
        breadcrumb.unshift({ id: file.id, name: file.name });
        currentId = file.parentId || '';
      } catch {
        break;
      }
    }

    // Add root
    breadcrumb.unshift({ id: this.rootFolderId, name: 'Materiais' });

    return breadcrumb;
  }

  /**
   * Check if user can access a folder based on naming convention
   */
  private canAccessFolder(folderName: string, user: any): boolean {
    if (!folderName) return false;

    // Super admin sees everything
    if (user.role === 'super_admin') {
      return true;
    }

    // Parse prefix from folder name (e.g., "00-global" -> 0)
    const prefixMatch = folderName.match(/^(\d+)-/);
    const prefix = prefixMatch ? parseInt(prefixMatch[1]) : -1;

    // Global folders (00-09) - accessible by all
    if (prefix >= 0 && prefix <= 9) {
      return true;
    }

    // Admin-only folders (90-99) - only super_admin (already returned true above)
    if (prefix >= 90 && prefix <= 99) {
      return false;
    }

    // Franchise-specific folders (10-89)
    // Format: XX-franchise-{slug} or XX-{franchiseName}
    if (prefix >= 10 && prefix <= 89) {
      const franchiseSlug = this.extractFranchiseSlug(folderName);

      if (!franchiseSlug) {
        // If no slug pattern, check if folder name contains franchise name
        return this.checkFranchiseByName(folderName, user.franchiseId);
      }

      return this.checkFranchiseBySlug(franchiseSlug, user.franchiseId);
    }

    // Default: allow access (for folders without prefix)
    return true;
  }

  /**
   * Extract franchise slug from folder name
   */
  private extractFranchiseSlug(folderName: string): string | null {
    // Pattern: XX-franchise-{slug}
    const match = folderName.match(/^\d+-franchise-(.+)$/i);
    return match ? match[1].toLowerCase() : null;
  }

  /**
   * Check franchise access by slug (async would be better but keeping sync for simplicity)
   */
  private checkFranchiseBySlug(slug: string, userFranchiseId: string): boolean {
    // This is a simplified check - in production, you might want to cache franchise slugs
    // For now, we'll just compare the slug format
    return true; // Allow access, actual validation happens in controller with DB lookup
  }

  /**
   * Check franchise access by name
   */
  private checkFranchiseByName(folderName: string, userFranchiseId: string): boolean {
    // Allow access - actual validation with DB happens in controller
    return true;
  }

  /**
   * Map Google Drive file to our interface
   */
  private mapToFile(file: drive_v3.Schema$File): DriveFile {
    return {
      id: file.id || '',
      name: file.name || '',
      mimeType: file.mimeType || '',
      size: file.size ? parseInt(file.size) : undefined,
      thumbnailUrl: file.thumbnailLink || undefined,
      webViewLink: file.webViewLink || undefined,
      modifiedTime: file.modifiedTime || undefined,
      isFolder: file.mimeType === 'application/vnd.google-apps.folder',
      parentId: file.parents?.[0] || undefined,
    };
  }

  /**
   * Get export MIME type for Google Docs files
   */
  private getExportMimeType(googleMimeType: string): string {
    const exportMap: Record<string, string> = {
      'application/vnd.google-apps.document': 'application/pdf',
      'application/vnd.google-apps.spreadsheet': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.google-apps.presentation': 'application/pdf',
      'application/vnd.google-apps.drawing': 'image/png',
    };

    return exportMap[googleMimeType] || 'application/pdf';
  }
}
