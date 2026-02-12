// src/modules/upload/controllers/upload.controller.ts

import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { FormDataRequest } from 'nestjs-form-data';
import { IGenericUploadResult } from 'src/common/interfaces';
import { UploadsService } from 'src/modules/uploads/services/uploads.service';
import type { CustomRequest } from 'src/types/auth'; // Usando o tipo que você definiu
import { GenericFileUploadDto } from '../dto/generic-file-upload.dto';

@Controller('uploads')
export class UploadsController {
  constructor(
    private readonly uploadsService: UploadsService,
    private readonly configService: ConfigService,
    // 🔑 Injeção da Request para obter o tenantId
    @Inject(REQUEST) private request: CustomRequest,
  ) {
    /* void */
  }

  @ApiConsumes('multipart/form-data')
  // 🔑 Adiciona o Body para documentar o DTO que contém o campo 'files'
  @ApiBody({ type: GenericFileUploadDto })
  @Post('file')
  @FormDataRequest()
  async uploadGenericFiles(
    @Body() uploadDto: GenericFileUploadDto,
  ): Promise<IGenericUploadResult[]> {
    // 2. Chama o serviço para processar os arquivos
    const results = await this.uploadsService.uploadFiles(uploadDto.files);
    return results;
  }
}