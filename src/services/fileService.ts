/**
 * ============================================================================
 * FILE SERVICE
 * HTEIM School of Ministry
 * ============================================================================
 * Handles document uploads, image uploads, CDN asset resolution,
 * and bucket synchronization with Supabase Storage and Express API.
 */

import { ApiClientError } from './apiClient';
import { uploadToSupabaseStorage, ensureSupabaseStorageUrl, supabase } from '../lib/supabaseClient';
import { logger } from '../lib/logger';

export type StorageBucket = 'library' | 'assignments' | 'classroom_media' | 'profile-pictures';

export interface FileUploadResult {
  publicUrl: string;
  bucket: StorageBucket;
  fileName: string;
  sizeBytes?: number;
  mimeType?: string;
  uploadedAt: string;
}

export interface FileValidationOptions {
  maxSizeMb?: number;
  allowedExtensions?: string[];
}

const DEFAULT_ALLOWED_EXTENSIONS = [
  'pdf', 'doc', 'docx', 'txt', 'rtf', 'ppt', 'pptx',
  'jpg', 'jpeg', 'png', 'webp', 'svg',
  'mp3', 'wav', 'mp4', 'm4a', 'zip'
];

export class FileService {
  /**
   * Validates file size and file extension.
   */
  public validateFile(file: File | { name: string; size?: number }, options: FileValidationOptions = {}): void {
    const maxMb = options.maxSizeMb || 50;
    const allowed = options.allowedExtensions || DEFAULT_ALLOWED_EXTENSIONS;

    if (file.size && file.size > maxMb * 1024 * 1024) {
      throw new ApiClientError(
        `File size exceeds maximum limit of ${maxMb}MB`,
        400,
        '/storage/upload',
        'validation'
      );
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext && !allowed.includes(ext)) {
      throw new ApiClientError(
        `File type .${ext} is not allowed. Allowed types: ${allowed.slice(0, 8).join(', ')}...`,
        400,
        '/storage/upload',
        'validation'
      );
    }
  }

  /**
   * Uploads a file (File object or Data URL) to a designated storage bucket.
   */
  public async uploadFile(
    bucket: StorageBucket,
    fileName: string,
    fileOrDataUrl: File | string,
    validationOptions?: FileValidationOptions
  ): Promise<FileUploadResult> {
    const cleanFileName = fileName.trim().replace(/[^a-zA-Z0-9._-]/g, '_');
    if (!cleanFileName) {
      throw new ApiClientError('File name is required for upload', 400, '/storage/upload', 'validation');
    }

    if (fileOrDataUrl instanceof File) {
      this.validateFile(fileOrDataUrl, validationOptions);
    }

    try {
      const publicUrl = await uploadToSupabaseStorage(bucket, cleanFileName, fileOrDataUrl);
      if (!publicUrl) {
        throw new Error('Storage service returned empty URL');
      }

      return {
        publicUrl,
        bucket,
        fileName: cleanFileName,
        sizeBytes: fileOrDataUrl instanceof File ? fileOrDataUrl.size : undefined,
        mimeType: fileOrDataUrl instanceof File ? fileOrDataUrl.type : undefined,
        uploadedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      logger.error(`[FileService] Upload failed for ${cleanFileName} to ${bucket}:`, err);
      throw new ApiClientError(
        err.message || 'File upload failed',
        500,
        `/storage/${bucket}/${cleanFileName}`,
        'network',
        err
      );
    }
  }

  /**
   * Uploads a student avatar photo with automatic name sanitization.
   */
  public async uploadStudentPhoto(studentName: string, file: File | string): Promise<string> {
    const cleanName = studentName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const fileName = `${cleanName}_photo_${Date.now()}.jpg`;
    const result = await this.uploadFile('profile-pictures', fileName, file, {
      maxSizeMb: 10,
      allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
    });
    return result.publicUrl;
  }

  /**
   * Uploads a student coursework assignment document.
   */
  public async uploadAssignmentDocument(
    assignmentId: string,
    studentName: string,
    file: File | string,
    originalFileName?: string
  ): Promise<FileUploadResult> {
    const cleanStudent = studentName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const safeOriginal = (originalFileName || (file instanceof File ? file.name : 'submission.pdf'))
      .replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${assignmentId}_${cleanStudent}_${Date.now()}_${safeOriginal}`;

    return this.uploadFile('assignments', fileName, file, {
      maxSizeMb: 50,
    });
  }

  /**
   * Resolves a public CDN URL for a stored asset.
   */
  public async getFileCdnUrl(bucket: string, fileName: string, fallbackUrl?: string): Promise<string> {
    return ensureSupabaseStorageUrl(bucket, fileName, fallbackUrl || '');
  }

  /**
   * Deletes a file from Supabase storage bucket.
   */
  public async deleteFile(bucket: StorageBucket, filePath: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage.from(bucket).remove([filePath]);
      if (error) {
        logger.warn(`[FileService] Delete failed for ${filePath} in ${bucket}:`, error);
        return false;
      }
      return true;
    } catch (err) {
      logger.error(`[FileService] Delete error:`, err);
      return false;
    }
  }
}

export const fileService = new FileService();
