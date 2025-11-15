// src/modules/delivery/dto/location.dto.ts
import { IsNumber, IsString } from 'class-validator';

export class UpdateLocationDto {
  @IsString()
  deliveryPersonId: string;

  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;
}
