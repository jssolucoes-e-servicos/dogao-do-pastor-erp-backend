import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateStopDto {
  @IsString()
  stopId: string;

  @IsIn(['delivered', 'skipped', 'failed'])
  status: 'delivered' | 'skipped' | 'failed';

  @IsOptional()
  reason?: string;
}
