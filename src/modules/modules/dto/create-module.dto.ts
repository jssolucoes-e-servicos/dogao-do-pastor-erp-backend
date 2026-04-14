import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateModuleDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsString()
  description: string;

  @IsString()
  ctrl: string;

  @IsString()
  page: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
