import { BaseService } from '@/common/services/base.service';
import { LoggerService } from '@/modules/logger/services/logger.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';
import { SellerCreateDTO } from 'src/modules/seller/dto/seller-create.dto';
import { SellerFindByTagDTO } from 'src/modules/seller/dto/seller-find-by-tag.dto';
import {
  SellerRetrieveDTO,
  SellerRetrieveWithCellDTO,
} from 'src/modules/seller/dto/seller-retrieve.dto';
import { SellerUpdateDTO } from 'src/modules/seller/dto/seller-update.dto';

@Injectable()
export class SellerService extends BaseService {
  constructor(loggerService: LoggerService, prismaService: PrismaService) {
    super(loggerService, prismaService);
  }

  async create(sellerDTO: SellerCreateDTO): Promise<SellerRetrieveDTO> {
    const sellerExists = await this.prisma.seller.findFirst({
      where: { tag: sellerDTO.tag },
    });
    if (sellerExists) {
      throw new Error('Já existe este vendedor');
    }
    const seller = await this.prisma.seller.create({
      data: {
        cellId: sellerDTO.cellId,
        name: sellerDTO.name,
        phone: sellerDTO.phone,
        tag: sellerDTO.tag,
      },
    });
    return seller;
  }

  async update(sellerDTO: SellerUpdateDTO): Promise<SellerRetrieveDTO> {
    const seller = await this.prisma.seller.update({
      where: { id: sellerDTO.id },
      data: {
        cellId: sellerDTO.cellId,
        name: sellerDTO.name,
        phone: sellerDTO.phone,
        tag: sellerDTO.tag,
      },
    });
    return seller;
  }

  async findByTag({
    tag,
  }: SellerFindByTagDTO): Promise<SellerRetrieveWithCellDTO | null> {
    const seller = await this.prisma.seller.findUnique({
      where: { tag: tag },
      include: { cell: true },
    });

    if (!seller) {
      throw new NotFoundException('Vendedor não encontrado.');
    }
    return seller;
  }
}
