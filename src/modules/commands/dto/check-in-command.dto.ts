import { IsArray, IsOptional, IsString } from 'class-validator';

export class CheckInCommandItemDto {
  @IsString()
  itemId: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  removedIngredients?: string[];
}

export class CheckInCommandDto {
  @IsOptional()
  @IsArray()
  items?: CheckInCommandItemDto[];
}
