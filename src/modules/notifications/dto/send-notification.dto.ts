import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class RegisterTokenDto {
  @IsString()
  token: string;

  @IsString()
  platform: string;
}

export class SendNotificationDto {
  @IsString()
  type: string;

  @IsString()
  title: string;

  @IsString()
  body: string;

  @IsOptional()
  data?: Record<string, any>;
}

export class SendToContributorDto extends SendNotificationDto {
  @IsString()
  contributorId: string;
}

export class SendToCellDto extends SendNotificationDto {
  @IsString()
  cellId: string;
}

export class SendToNetworkDto extends SendNotificationDto {
  @IsString()
  networkId: string;
}

export class SendToAllDto extends SendNotificationDto {}

export class UpdatePreferencesDto {
  @IsOptional()
  @IsBoolean()
  sales?: boolean;

  @IsOptional()
  @IsBoolean()
  orders?: boolean;

  @IsOptional()
  @IsBoolean()
  ranking?: boolean;

  @IsOptional()
  @IsBoolean()
  cell?: boolean;

  @IsOptional()
  @IsBoolean()
  network?: boolean;
}
