// src/common/interfaces/elementals/generic-upload-result.interface.ts

/**
 * Interface generica de resposta de uploads
 * @interface IGenericUploadResult
 */
export interface IGenericUploadResult {
  originalName: string;
  path: string;
  url: string;
  mimeType: string;
  size: number;
  tenantId: string;
  userId: string;
}

export interface IGeniricUploadErrorResul {
  originalName: string;
  path: null;
  url: null;
  error: string;
}
