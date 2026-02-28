import {
  HasMimeType,
  IsFile,
  MaxFileSize,
  MemoryStoredFile,
} from 'nestjs-form-data';

export class UploadPhotoDto {
  @IsFile()
  @MaxFileSize(2 * 1024 * 1024) // Limite de 2MB
  @HasMimeType(['image/jpeg', 'image/png', 'image/webp'])
  photo: MemoryStoredFile;
}
