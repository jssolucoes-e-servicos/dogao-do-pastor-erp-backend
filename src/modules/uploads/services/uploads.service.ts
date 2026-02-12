// src/modules/upload/services/upload.service.ts

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
   * Processa o upload de um ou mais arquivos para o MinIO.
   * @param files Array de arquivos em memória.
   * @returns Array de metadados dos arquivos salvos.
   */
  async uploadFiles(
    files: MemoryStoredFile[],
  ): Promise<IGenericUploadResult[]> {
    const fileArray = Array.isArray(files) ? files : [files];
    this.logger.log(`Recebidos ${fileArray.length} arquivos para upload.`);
    const uploadPromises = fileArray.map(async (file) => {
      const uploadInfo = await this.minioService.uploadFile(
        file.buffer,
        file.originalName,
        file.mimeType,
      );

      return {
        originalName: file.originalName,
        path: uploadInfo.path,
        url: this.minioService.getFileUrl(uploadInfo.path),
        mimeType: file.mimeType,
        size: file.size,
      } as IGenericUploadResult;
    });

    const results = await Promise.all(uploadPromises);

    this.logger.log(`Uploads concluídos. Resultados: ${results.length}`);
    return results;
  }
}
