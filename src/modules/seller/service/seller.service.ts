import {
  BaseService,
  ConfigService,
  LoggerService,
  PrismaService,
} from '@/common/helpers/importer-helper';
import { Injectable, NotFoundException } from '@nestjs/common';
import { SellerCreateDTO } from 'src/modules/seller/dto/seller-create.dto';
import { SellerFindByTagDTO } from 'src/modules/seller/dto/seller-find-by-tag.dto';
import {
  SellerRetrieveDTO,
  SellerRetrieveWithCellDTO,
} from 'src/modules/seller/dto/seller-retrieve.dto';
import { SellerUpdateDTO } from 'src/modules/seller/dto/seller-update.dto';

@Injectable()
export class SellerService extends BaseService {
  constructor(
    loggerService: LoggerService,
    prismaService: PrismaService,
    configService: ConfigService,
  ) {
    super(loggerService, prismaService, configService);
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
    const seller = await this.prisma.seller.findFirst({
      where: { tag: tag },
      include: { cell: true },
    });

    if (!seller) {
      throw new NotFoundException('Vendedor não encontrado.');
    }
    return seller;
  }

  async list(): Promise<SellerRetrieveWithCellDTO[]> {
    const sellers = await this.prisma.seller.findMany({
      where: { active: true },
      include: { cell: true },
    });

    return sellers;
  }
}
