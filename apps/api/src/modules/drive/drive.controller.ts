import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DriveService, DriveFile, BreadcrumbItem } from './drive.service';

@ApiTags('drive')
@Controller('drive')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DriveController {
  constructor(private readonly driveService: DriveService) {}

  @Get('status')
  @ApiOperation({ summary: 'Check if Google Drive is configured' })
  @ApiResponse({ status: 200, description: 'Drive configuration status' })
  getStatus() {
    return {
      configured: this.driveService.isConfigured(),
    };
  }

  @Get('folders')
  @ApiOperation({ summary: 'List root folders (filtered by user access)' })
  @ApiResponse({ status: 200, description: 'List of accessible folders' })
  async listRootFolders(@CurrentUser() user: any): Promise<DriveFile[]> {
    return this.driveService.listRootFolders(user);
  }

  @Get('folders/:folderId')
  @ApiOperation({ summary: 'List contents of a specific folder' })
  @ApiParam({ name: 'folderId', description: 'Google Drive folder ID' })
  @ApiResponse({ status: 200, description: 'Folder contents' })
  async listFolderContents(
    @Param('folderId') folderId: string,
    @CurrentUser() user: any,
  ): Promise<DriveFile[]> {
    return this.driveService.listFolderContents(folderId, user);
  }

  @Get('files/:fileId')
  @ApiOperation({ summary: 'Get file metadata' })
  @ApiParam({ name: 'fileId', description: 'Google Drive file ID' })
  @ApiResponse({ status: 200, description: 'File metadata' })
  async getFileDetails(@Param('fileId') fileId: string): Promise<DriveFile> {
    return this.driveService.getFileMetadata(fileId);
  }

  @Get('files/:fileId/download')
  @ApiOperation({ summary: 'Download a file' })
  @ApiParam({ name: 'fileId', description: 'Google Drive file ID' })
  @ApiResponse({ status: 200, description: 'File stream' })
  async downloadFile(
    @Param('fileId') fileId: string,
    @Res() res: Response,
  ): Promise<void> {
    const { stream, metadata } = await this.driveService.downloadFile(fileId);

    // Set appropriate headers
    res.setHeader('Content-Type', metadata.mimeType || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(metadata.name)}"`,
    );

    if (metadata.size) {
      res.setHeader('Content-Length', metadata.size);
    }

    // Pipe the stream to response
    stream.pipe(res);

    stream.on('error', () => {
      if (!res.headersSent) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          message: 'Erro ao baixar arquivo',
        });
      }
    });
  }

  @Get('files/:fileId/preview')
  @ApiOperation({ summary: 'Get preview URL for a file' })
  @ApiParam({ name: 'fileId', description: 'Google Drive file ID' })
  @ApiResponse({ status: 200, description: 'Preview URL' })
  async getPreviewUrl(@Param('fileId') fileId: string): Promise<{ url: string }> {
    const url = await this.driveService.getPreviewUrl(fileId);
    return { url };
  }

  @Get('files/:fileId/stream')
  @ApiOperation({ summary: 'Stream file content (for preview)' })
  @ApiParam({ name: 'fileId', description: 'Google Drive file ID' })
  @ApiResponse({ status: 200, description: 'File stream' })
  async streamFile(
    @Param('fileId') fileId: string,
    @Res() res: Response,
  ): Promise<void> {
    const { stream, metadata } = await this.driveService.downloadFile(fileId);

    // Set headers for inline viewing
    res.setHeader('Content-Type', metadata.mimeType || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(metadata.name)}"`,
    );

    if (metadata.size) {
      res.setHeader('Content-Length', metadata.size);
    }

    // Allow embedding in iframes
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');

    // Pipe the stream to response
    stream.pipe(res);

    stream.on('error', () => {
      if (!res.headersSent) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          message: 'Erro ao carregar arquivo',
        });
      }
    });
  }

  @Get('search')
  @ApiOperation({ summary: 'Search files across accessible folders' })
  @ApiQuery({ name: 'q', description: 'Search query', required: true })
  @ApiResponse({ status: 200, description: 'Search results' })
  async searchFiles(
    @Query('q') query: string,
    @CurrentUser() user: any,
  ): Promise<DriveFile[]> {
    return this.driveService.searchFiles(query, user);
  }

  @Get('breadcrumb/:folderId')
  @ApiOperation({ summary: 'Get folder hierarchy for navigation' })
  @ApiParam({ name: 'folderId', description: 'Google Drive folder ID' })
  @ApiResponse({ status: 200, description: 'Breadcrumb path' })
  async getBreadcrumb(
    @Param('folderId') folderId: string,
  ): Promise<BreadcrumbItem[]> {
    return this.driveService.getBreadcrumb(folderId);
  }
}
