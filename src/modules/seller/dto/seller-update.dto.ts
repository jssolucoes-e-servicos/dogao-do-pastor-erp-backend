import { PartialType } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';
import { SellerCreateDTO } from './seller-create.dto';

export class SellerUpdateDTO extends PartialType(SellerCreateDTO) {
  @IsMongoId()
  id: string;
}
