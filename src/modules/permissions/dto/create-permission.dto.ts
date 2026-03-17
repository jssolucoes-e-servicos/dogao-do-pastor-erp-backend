import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreatePermissionDto {
  @IsOptional()
  @IsString()
  contributorId?: string;

  @IsOptional()
  @IsString()
  roleId?: string;

  @IsString()
  moduleId: string;

  @IsOptional()
  @IsBoolean()
  access?: boolean;

  @IsOptional()
  @IsBoolean()
  create?: boolean;

  @IsOptional()
  @IsBoolean()
  update?: boolean;

  @IsOptional()
  @IsBoolean()
  delete?: boolean;

  @IsOptional()
  @IsBoolean()
  report?: boolean;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
