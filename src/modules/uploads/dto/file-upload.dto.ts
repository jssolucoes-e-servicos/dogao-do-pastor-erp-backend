// src/common/dto/file-upload.dto.ts

import { IsString, MaxLength } from 'class-validator';
import {
  HasMimeType,
  IsFile,
  IsFiles,
  MaxFileSize,
  MemoryStoredFile,
} from 'nestjs-form-data';

// 💡 DTO para uploads de um único arquivo (Ex: Foto de Perfil)
export class SingleFileUploadDto {
  @IsFile() // Garante que é um arquivo
  @MaxFileSize(1 * 1024 * 1024) // Limite de 1MB para foto de perfil
  @HasMimeType(['image/jpeg', 'image/png']) // Apenas imagens
  profilePicture: MemoryStoredFile; // O tipo final do arquivo na memória

  @IsString()
  @MaxLength(100)
  // Campos de texto adicionais que vêm no mesmo formulário
  documentName: string;
}

// 💡 DTO para uploads de múltiplos arquivos (Ex: Notas Fiscais)
export class MultiFileUploadDto {
  @IsFiles() // Garante que é um array de arquivos
  @MaxFileSize(5 * 1024 * 1024, { each: true }) // 5MB para cada arquivo
  @HasMimeType(['application/pdf', 'image/jpeg'], { each: true }) // PDFs ou JPGs
  documents: MemoryStoredFile[]; // Array de arquivos
}
