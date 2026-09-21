import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { StorageService } from './storage.service';
import { ConfigService } from '@nestjs/config';

// Mock AWS SDK before importing StorageService
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({}),
  })),
  PutObjectCommand: jest.fn(),
  GetObjectCommand: jest.fn(),
  DeleteObjectCommand: jest.fn(),
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://signed-url.example.com/file'),
}));

describe('StorageService - IDOR & Path Traversal Protection', () => {
  let service: StorageService;
  let mockConfigService: Partial<ConfigService>;

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 's3.region') return 'us-east-1';
        if (key === 's3.bucket') return 'test-bucket';
        if (key === 's3.accessKeyId') return 'test-key';
        if (key === 's3.secretAccessKey') return 'test-secret';
        if (key === 's3.forcePathStyle') return false;
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  describe('validateFileAccess', () => {
    it('should allow valid file access within workspace directory', async () => {
      const workspaceId = 'workspace-123';
      const fileKey = `uploads/${workspaceId}/documents/file.pdf`;

      // Should not throw
      await expect(
        service.getSignedUrl(workspaceId, fileKey),
      ).resolves.toBeDefined();
    });

    it('should block path traversal attempts with ..', async () => {
      const workspaceId = 'workspace-123';
      const fileKey = `uploads/${workspaceId}/../workspace-456/secret.pdf`;

      await expect(
        service.getSignedUrl(workspaceId, fileKey),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.getSignedUrl(workspaceId, fileKey),
      ).rejects.toThrow('Path traversal detected');
    });

    it('should block access to files in other workspaces', async () => {
      const workspaceId = 'workspace-123';
      const fileKey = `uploads/workspace-456/documents/file.pdf`;

      await expect(
        service.getSignedUrl(workspaceId, fileKey),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        service.getSignedUrl(workspaceId, fileKey),
      ).rejects.toThrow('Access denied');
    });

    it('should block access to files outside uploads directory', async () => {
      const workspaceId = 'workspace-123';
      const fileKey = `system/config/secrets.json`;

      await expect(
        service.getSignedUrl(workspaceId, fileKey),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should normalize backslashes to forward slashes', async () => {
      const workspaceId = 'workspace-123';
      const fileKey = `uploads\\${workspaceId}\\..\\workspace-456\\file.pdf`;

      // Should be normalized and caught
      await expect(
        service.getSignedUrl(workspaceId, fileKey),
      ).rejects.toThrow(BadRequestException);
    });

    it('should block complex path traversal patterns', async () => {
      const workspaceId = 'workspace-123';
      const patterns = [
        `uploads/${workspaceId}/docs/../../workspace-456/file.pdf`,
        `uploads/${workspaceId}/./../workspace-456/file.pdf`,
        `uploads/${workspaceId}/./../../system/file.pdf`,
      ];

      for (const fileKey of patterns) {
        await expect(
          service.getSignedUrl(workspaceId, fileKey),
        ).rejects.toThrow();
      }
    });

    it('should allow deeply nested valid paths', async () => {
      const workspaceId = 'workspace-123';
      const fileKey = `uploads/${workspaceId}/docs/2024/q1/reports/final.pdf`;

      // Should not throw
      await expect(
        service.getSignedUrl(workspaceId, fileKey),
      ).resolves.toBeDefined();
    });

    it('should validate on uploadFile', async () => {
      const workspaceId = 'workspace-123';
      const fileKey = `uploads/workspace-456/file.pdf`;
      const buffer = Buffer.from('test');

      await expect(
        service.uploadFile(workspaceId, fileKey, buffer, 'application/pdf'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should validate on deleteFile', async () => {
      const workspaceId = 'workspace-123';
      const fileKey = `uploads/workspace-456/file.pdf`;

      await expect(
        service.deleteFile(workspaceId, fileKey),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('edge cases', () => {
    it('should handle empty workspace IDs by rejecting access', async () => {
      const fileKey = `uploads/workspace-123/documents/file.pdf`;

      // Empty workspaceId should not match any valid path
      await expect(
        service.getSignedUrl('', fileKey),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should handle URL-encoded path traversal attempts', async () => {
      const workspaceId = 'workspace-123';
      // Note: URL decoding should happen before this validation
      const fileKey = `uploads/${workspaceId}/%2e%2e/workspace-456/file.pdf`;

      // If already decoded, will contain '..'
      await expect(
        service.getSignedUrl(workspaceId, fileKey.replace(/%2e/g, '.')),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
