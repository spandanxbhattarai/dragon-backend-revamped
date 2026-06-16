import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { Readable } from 'stream';
import { s3Client, S3_BUCKET } from '../../config/aws';

export interface ObjectStream {
  body: Readable;
  contentType: string;
  contentLength?: number;
}

export const filesService = {
  // Full-object stream from S3, proxied same-origin. Used for PDFs, which
  // pdf.js fetches with JS (CORS-gated) — serving via our own origin sidesteps
  // the need for an S3 CORS rule. Images/video use signed URLs directly.
  getObjectStream: async (key: string): Promise<ObjectStream> => {
    const res = await s3Client.send(new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }));
    return {
      body: res.Body as Readable,
      contentType: res.ContentType ?? 'application/octet-stream',
      contentLength: res.ContentLength,
    };
  },

  deleteFile: async (key: string): Promise<void> => {
    const command = new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    });
    await s3Client.send(command);
  },

  uploadBuffer: async (
    buffer: Buffer,
    key: string,
    mimeType: string,
  ): Promise<string> => {
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    });

    await s3Client.send(command);

    return `https://${S3_BUCKET}.s3.amazonaws.com/${key}`;
  },

  // Short-lived signed URL for downloading a private object.
  // Use when access must be enforced server-side and the public URL must not leak.
  getPresignedDownloadUrl: async (
    key: string,
    expiresInSeconds: number = 300,
    downloadFilename?: string,
  ): Promise<string> => {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      ...(downloadFilename
        ? { ResponseContentDisposition: `attachment; filename="${downloadFilename}"` }
        : {}),
    });
    return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
  },

  // Short-lived signed URL for INLINE viewing (preview, not attachment). The
  // browser/pdf.js fetches straight from S3 — no bytes flow through our server.
  // TTL must comfortably outlast a viewing session (video playback, PDF paging)
  // since S3 range requests after expiry fail.
  getPresignedViewUrl: async (
    key: string,
    expiresInSeconds: number,
    mimeType?: string,
  ): Promise<string> => {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      ResponseContentDisposition: 'inline',
      ...(mimeType ? { ResponseContentType: mimeType } : {}),
    });
    return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
  },
};
