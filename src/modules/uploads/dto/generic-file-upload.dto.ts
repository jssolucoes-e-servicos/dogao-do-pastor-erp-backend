// src/common/dto/generic-file-upload.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import {
  HasMimeType,
  IsFiles,
  MaxFileSize,
  MemoryStoredFile,
} from 'nestjs-form-data';

// Lista de MIME types genéricos e específicos solicitados
const ALLOWED_MIME_TYPES = [
  'application/pdf', // PDF
  'application/vnd.ms-excel', // Excel .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // Excel .xlsx
  'application/msword', // Word .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // Word .docx
  'application/vnd.ms-powerpoint', // PowerPoint .ppt
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PowerPoint .pptx
  'application/zip', // ZIP
  'image/jpeg', // JPEG
  'image/png', // PNG
  // Tipos comuns de edição (pode exigir análise mais detalhada em produção):
  'image/vnd.coreldraw', // CorelDRAW (CDR)
  'image/vnd.adobe.photoshop', // Photoshop (PSD)
  'application/illustrator', // Illustrator (AI)
];

// O DTO aceita um ou mais arquivos
export class GenericFileUploadDto {
  // Garantimos que é um array de arquivos, mesmo que seja um só
  @ApiProperty({
    type: 'array', // Indica que é um array
    items: {
      type: 'string', // Indica que o item é um 'string' (para upload)
      format: 'binary', // Indica que o formato é um arquivo binário
    },
    description: `Lista de arquivos (Max 10MB/arquivo). Tipos aceitos: ${ALLOWED_MIME_TYPES.join(', ')}`,
    required: true,
  })
  @IsFiles()
  @MaxFileSize(10 * 1024 * 1024, { each: true }) // Exemplo: 10MB por arquivo
  @HasMimeType(ALLOWED_MIME_TYPES, { each: true }) // Valida todos os tipos
  files: MemoryStoredFile[];
}
