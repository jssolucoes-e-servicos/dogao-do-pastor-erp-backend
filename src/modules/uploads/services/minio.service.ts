// src/modules/upload/services/minio.service.ts

import { Injectable } from '@nestjs/common';
import * as Minio from 'minio';
import {
  BaseService,
  ConfigService,
  LoggerService,
  PrismaService,
} from 'src/common/helpers/importer.helper';

interface IUploadResult {
  path: string;
  etag: string;
  bucket: string;
}

@Injectable()
export class MinioService extends BaseService {
  private readonly minioClient: Minio.Client;
  private readonly bucketName: string;
  private readonly minioEndpoit: string;
  private readonly externalHost: string;

  private readonly PUBLIC_READ_POLICY = (bucket: string) => ({
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: { AWS: ['*'] },
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${bucket}/*`],
      },
    ],
  });

  constructor(
    configService: ConfigService,
    loggerService: LoggerService,
    prismaService: PrismaService,
  ) {
    super(configService, loggerService, prismaService);

    this.bucketName = this.configs.get('MINIO_BUCKET_NAME')!;
    this.minioEndpoit = this.configs.get('MINIO_ENDPOINT')!;
    this.externalHost = this.configs.get('MINIO_HOST_EXTERNAL')!;
    const minioPort: number | undefined = this.configs.get(
      'MINIO_PORT',
      undefined,
    );

    // Inicializa o cliente MinIO
    this.minioClient = new Minio.Client({
      endPoint: this.minioEndpoit,
      ...(minioPort && { port: minioPort }),
      accessKey: this.configs.get('MINIO_ACCESS_KEY')!,
      secretKey: this.configs.get('MINIO_SECRET_KEY')!,
      useSSL: true,
    });

    this.logger.log(
      `Connecting to MinIO at ${this.minioEndpoit}${minioPort ? ':' + minioPort : ''} (SSL: ${true})`,
    );

    // Chamada assíncrona para garantir a existência do bucket
    void this.ensureBucketExists(this.bucketName);
  }

  /**
   * Garante que o bucket existe e aplica a política de acesso público de leitura.
   */
  private async ensureBucketExists(bucketName: string): Promise<void> {
    const found = await this.minioClient.bucketExists(bucketName);

    // 🔑 APLICAÇÃO DA POLÍTICA PÚBLICA (RESOLVE O ACESSO NEGADO)
    const policy = JSON.stringify(this.PUBLIC_READ_POLICY(bucketName));

    if (!found) {
      // 1. Cria o bucket
      await this.minioClient.makeBucket(bucketName, 'us-east-1'); // Região padrão
      this.logger.log(`Bucket '${bucketName}' criado.`);

      // 2. Aplica a política pública de leitura
      await this.minioClient.setBucketPolicy(bucketName, policy);
      this.logger.log(
        `Política 'public read' aplicada ao bucket '${bucketName}'.`,
      );
    } else {
      // Se o bucket já existe, tenta garantir que a política está aplicada (pode lançar erro se não tiver permissão)
      try {
        await this.minioClient.setBucketPolicy(bucketName, policy);
      } catch (error) {
        this.logger.warn(
          `Não foi possível re-aplicar a política pública ao bucket '${bucketName}'.`,
        );
      }
    }
  }

  /**
   * Faz o upload de um buffer de arquivo para o MinIO.
   * ...
   */
  async uploadFile(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
  ): Promise<IUploadResult> {
    const timestamp = Date.now();
    const objectName = `${timestamp}_${originalName.replace(/\s/g, '_')}`;
    const metaData = {
      'Content-Type': mimeType,
    };

    const uploadedObjectInfo = await this.minioClient.putObject(
      this.bucketName,
      objectName,
      buffer,
      buffer.length,
      metaData,
    );

    // Retorna o caminho que será salvo no banco de dados do negócio (Fatura, Cliente, etc.)
    return {
      path: `/${this.bucketName}/${objectName}`,
      etag: uploadedObjectInfo.etag,
      bucket: this.bucketName,
    };
  }

  // Método para obter a URL de acesso ao arquivo (pode ser pré-assinado, dependendo da configuração)
  getFileUrl(path: string): string {
    // Usa o host externo e assume HTTPS (tratado pelo reverse proxy)
    return `https://${this.externalHost}${path}`;
  }
}