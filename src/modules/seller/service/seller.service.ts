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
import { EvolutionNotificationsService } from '../../evolution/services/evolution-notifications.service';

@Injectable()
export class SellerService extends BaseService {
  constructor(
    loggerService: LoggerService,
    prismaService: PrismaService,
    configService: ConfigService,
    private readonly evolutionNotificationsService: EvolutionNotificationsService,
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

  async findById(id: string): Promise<SellerRetrieveWithCellDTO | null> {
    const seller = await this.prisma.seller.findUnique({
      where: { id },
      include: { cell: true },
    });

    if (!seller) {
      throw new NotFoundException('Vendedor não encontrado.');
    }
    return seller;
  }

  async listforNetwork(
    networkId: string,
  ): Promise<SellerRetrieveWithCellDTO[]> {
    const sellers = await this.prisma.seller.findMany({
      where: {
        cell: {
          networkId: networkId,
        },
      },
      include: { cell: true },
    });

    return sellers;
  }

  async listforCell(cellId: string): Promise<SellerRetrieveWithCellDTO[]> {
    const sellers = await this.prisma.seller.findMany({
      where: {
        cellId: cellId,
      },
      include: { cell: true },
    });

    return sellers;
  }

  async listAll(): Promise<SellerRetrieveWithCellDTO[]> {
    const sellers = await this.prisma.seller.findMany({
      include: { cell: true },
    });

    return sellers;
  }

  async sendCreateNotification(id: string): Promise<boolean> {
    const seller = await this.prisma.seller.findUnique({
      where: { id },
      include: { cell: true },
    });

    if (!seller) {
      throw new NotFoundException('Vendedor não encontrado.');
    }
    await this.evolutionNotificationsService.sendSellerCreateNotification(
      seller,
    );
    return true;
  }
}
