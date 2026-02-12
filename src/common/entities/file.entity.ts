export class FileEntity {
  id: string;
  path: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
