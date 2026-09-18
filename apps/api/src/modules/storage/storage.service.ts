import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'video/mp4', 'video/webm', 'video/ogg',
  'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/webm',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain', 'text/csv',
]);

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

@Injectable()
export class StorageService {
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    const region = config.get<string>('s3.region', 'us-east-1');
    const endpoint = config.get<string | undefined>('s3.endpoint');
    const forcePathStyle = config.get<boolean>('s3.forcePathStyle', false);

    this.s3 = new S3Client({
      region,
      credentials: {
        accessKeyId: config.get<string>('s3.accessKeyId', ''),
        secretAccessKey: config.get<string>('s3.secretAccessKey', ''),
      },
      ...(endpoint && { endpoint }),
      forcePathStyle,
    });

    this.bucket = config.get<string>('s3.bucket', 'nexacrm-media');
  }

  /**
   * Generates a pre-signed PUT URL for direct browser upload.
   */
  async getPresignedUploadUrl(
    workspaceId: string,
    fileName: string,
    mimeType: string,
    size: number,
  ): Promise<{ uploadUrl: string; fileKey: string; expiresAt: Date }> {
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      throw new BadRequestException(`File type ${mimeType} is not allowed`);
    }
    if (size > MAX_FILE_SIZE) {
      throw new BadRequestException(`File size exceeds the 50 MB limit`);
    }

    const ext = extname(fileName) || '';
    const fileKey = `uploads/${workspaceId}/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${uuidv4()}${ext}`;
    const expiresIn = 300; // 5 minutes

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: fileKey,
      ContentType: mimeType,
      ContentLength: size,
    });

    const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn });
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    return { uploadUrl, fileKey, expiresAt };
  }

  /**
   * Generates a pre-signed GET URL for reading a file (1 hour TTL).
   */
  async getSignedUrl(fileKey: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: fileKey,
    });
    return getSignedUrl(this.s3, command, { expiresIn });
  }

  /**
   * Uploads a file buffer directly (used for small internal files like logos).
   */
  async uploadFile(fileKey: string, buffer: Buffer, mimeType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: fileKey,
      Body: buffer,
      ContentType: mimeType,
    });
    await this.s3.send(command);
    return fileKey;
  }

  /**
   * Deletes a file from S3.
   */
  async deleteFile(fileKey: string): Promise<void> {
    const command = new DeleteObjectCommand({ Bucket: this.bucket, Key: fileKey });
    await this.s3.send(command);
  }
}
