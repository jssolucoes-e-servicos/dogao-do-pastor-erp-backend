import { Injectable } from '@nestjs/common';
import { MemoryStoredFile } from 'nestjs-form-data';
import {
  BaseService,
  ConfigService,
  LoggerService,
  PrismaService,
} from 'src/common/helpers/importer.helper';
import { IGenericUploadResult } from 'src/common/interfaces';
import { MinioService } from './minio.service';

/** Diretórios padrão por entidade */
export const UPLOAD_DIRS = {
  orders:       'orders',
  contributors: 'contributors',
  partners:     'partners',
  customers:    'customers',
  settlements:  'settlements',
} as const;

export type UploadDir = typeof UPLOAD_DIRS[keyof typeof UPLOAD_DIRS];

@Injectable()
export class UploadsService extends BaseService {
  constructor(
    configService: ConfigService,
    loggerService: LoggerService,
    prismaService: PrismaService,
    private readonly minioService: MinioService,
  ) {
    super(configService, loggerService, prismaService);
  }

  /**
   * Upload de arquivos MemoryStoredFile (multipart/form-data).
   * @param files  Arquivos recebidos via nestjs-form-data
   * @param dir    Diretório/entidade (ex: 'orders', 'contributors')
   * @param id     ID da entidade para nomear o arquivo
   */
  async uploadFiles(
    files: MemoryStoredFile[],
    dir: string = 'misc',
    id = '',
  ): Promise<IGenericUploadResult[]> {
    const fileArray = Array.isArray(files) ? files : [files];
    const uploadPromises = fileArray.map(async (file) => {
      const fileName = `${dir}/${id ? `${id}-` : ''}${file.originalName}`;
      const uploadInfo = await this.minioService.uploadFile(
        file.buffer,
        fileName,
        file.mimeType,
      );
      return {
        originalName: fileName,
        path: uploadInfo.path,
        url: this.minioService.getFileUrl(uploadInfo.path),
        mimeType: file.mimeType,
        size: file.size,
        userId: id,
      } as IGenericUploadResult;
    });
    return Promise.all(uploadPromises);
  }

  /**
   * Upload de um Buffer diretamente (ex: PDF gerado em memória).
   * @param buffer   Conteúdo do arquivo
   * @param fileName Nome do arquivo (sem diretório)
   * @param dir      Diretório/entidade (ex: 'orders')
   * @param mimeType MIME type do arquivo
   */
  async uploadBuffer(
    buffer: Buffer,
    fileName: string,
    dir: string,
    mimeType = 'application/pdf',
  ): Promise<{ url: string; path: string }> {
    const objectName = `${dir}/${fileName}`;
    const uploadInfo = await this.minioService.uploadFile(buffer, objectName, mimeType);
    return {
      path: uploadInfo.path,
      url: this.minioService.getFileUrl(uploadInfo.path),
    };
  }
}
