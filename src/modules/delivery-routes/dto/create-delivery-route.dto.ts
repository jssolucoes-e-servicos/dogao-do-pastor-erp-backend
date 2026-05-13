import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class CreateDeliveryRouteDto {
  @ApiProperty({ description: 'ID do Entregador' })
  @IsString()
  @IsNotEmpty()
  deliveryPersonId: string;

  @ApiProperty({ description: 'Lista de IDs dos Pedidos para esta rota' })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  orderIds: string[];
}
