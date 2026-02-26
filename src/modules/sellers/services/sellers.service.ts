// src/modules/sellers/services/sellers.services.ts

import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { SellerEntity } from 'src/common/entities';
import { PaymentStatusEnum } from 'src/common/enums';
import {
  BaseCrudService,
  ConfigService,
  LoggerService,
  PrismaBase,
  PrismaService,
} from 'src/common/helpers/importer.helper';
import { IPaginatedResponse } from 'src/common/interfaces';
import { SellersNotificationsService } from '../../evolution/services/notifications/sellers-notifications.service';
import { CreateSellerDto } from '../dto/create-seller.dto';
import { UpdateSellerDto } from '../dto/update-seller.dto';

@Injectable()
export class SellersService extends BaseCrudService<
  SellerEntity,
  CreateSellerDto,
  UpdateSellerDto,
  PrismaBase.SellerDelegate
> {
  protected model: PrismaBase.SellerDelegate;

  constructor(
    configService: ConfigService,
    loggerService: LoggerService,
    prismaService: PrismaService,
    private readonly notifications: SellersNotificationsService,
  ) {
    super(configService, loggerService, prismaService);
    this.model = this.prisma.seller;
  }

  /* ======================================================
   * Regras de negócio
   * ====================================================== */

  private async validateCreate(dto: CreateSellerDto): Promise<void> {
    const or: PrismaBase.SellerWhereInput[] = [];

    if (dto.tag) {
      or.push({ tag: dto.tag });
    }

    if (!or.length) return;

    const exists = await this.model.findFirst({
      where: { OR: or },
    });

    if (!exists) return;

    if (exists.tag === dto.tag) {
      throw new ConflictException(
        `Já existe um Vendedor cadastrado com a TAG "${dto.tag}"`,
      );
    }
  }

  async create(dto: CreateSellerDto): Promise<SellerEntity> {
    await this.validateCreate(dto);
    return this.model.create({
      data: dto,
    }) as unknown as SellerEntity;
  }

  async list(
    query: PaginationQueryDto,
  ): Promise<IPaginatedResponse<SellerEntity>> {
    const { search } = query;

    let where = {};

    if (search) {
      where = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          {
            contributor: {
              name: { contains: search, mode: 'insensitive' },
            },
          },
        ],
      };
    }

    return this.paginate(query, {
      include: {
        contributor: true,
        cell: {
          include: {
            leader: true,
          },
        },
        orders: true,
        settlements: true,
        tickets: true,
      },
      orderBy: {
        contributor: {
          name: 'asc',
        },
      },
    });
  }

  async findByIdWithStats(id: string): Promise<{
    seller: SellerEntity;
    stats: {
      paidItems: number;
      pendingItems: number;
      totalValue: number;
    };
  }> {
    const seller = await super.findById(id, {
      include: {
        contributor: true,
        cell: {
          include: {
            leader: true, // Corrigido: precisa estar dentro de um objeto include
          },
        },
        orders: true,
        settlements: true,
        tickets: true,
      },
    });

    const stats = await this.getSellerStats(id);

    return {
      seller,
      stats,
    };
  }

  async findByTag(tag: string): Promise<SellerEntity> {
    const seller = await super.findOne({ tag: tag });
    return seller;
  }

  async findByContributorId(id: string): Promise<SellerEntity> {
    const seller = await super.findOne({ contributorId: id });
    return seller;
  }

  async findByCellId(id: string): Promise<SellerEntity> {
    const seller = await super.findOne({ cellId: id });
    return seller;
  }

  async update(id: string, dto: UpdateSellerDto): Promise<SellerEntity> {
    return super.update(id, dto);
  }

  async remove(id: string): Promise<SellerEntity> {
    return super.softDelete({ id });
  }

  async restore(id: string): Promise<SellerEntity> {
    return super.restoreData({ id });
  }

  async sendLinksAll() {
    const sellers = await this.model.findMany({
      include: {
        contributor: true,
      },
    });

    this.logger.log(`Iniciando disparo para ${sellers.length} vendedores...`);

    let successCount = 0;
    let errorCount = 0;

    for (const seller of sellers) {
      try {
        // Espera cada um terminar antes de ir para o próximo
        await this.notifications.welcomeSeller(seller);
        successCount++;
        // Opcional: pequeno delay de 500ms para evitar spam filters
        await new Promise( resolve => setTimeout(resolve, 500) );
      } catch (error) {
        errorCount++;
        this.logger.error(
          `Falha ao enviar para ${seller.contributor.name}: ${error.message}`,
        );
      }
    }

    return {
      total: sellers.length,
      success: successCount,
      errors: errorCount,
    };
  }

  async sendLinksFor(id: string) {
    let successCount = 0;
    let errorCount = 0;
    const seller = await this.model.findUnique({
      where: {
        id: id,
      },
      include: {
        contributor: true,
      },
    });

    if (!seller) {
      throw new NotFoundException('Nao encontrado vendedor para este id');
    }
    try {
      this.logger.log(`Iniciando disparo para 1 vendedore...`);

      // Espera cada um terminar antes de ir para o próximo
      await this.notifications.welcomeSeller(seller);
      successCount++;
      // Opcional: pequeno delay de 500ms para evitar spam filters
      await new Promise( resolve => setTimeout(resolve, 500) );
    } catch (error) {
      errorCount++;
      this.logger.error(
        `Falha ao enviar para ${seller.contributor.name}: ${error.message}`,
      );
    }

    return {
      total: 1,
      success: successCount,
      errors: errorCount,
    };
  }

  async getSellerStats(sellerId: string) {
    // Buscamos os itens agrupados pelo status do pedido pai
    const stats = await this.prisma.orderItem.groupBy({
      by: ['orderId'],
      where: {
        order: {
          sellerId: sellerId,
          active: true,
        },
      },
      _count: {
        id: true, // Conta quantos dogões (itens)
      },
      // Precisamos incluir o status do pedido na lógica,
      // então faremos um findMany com agregação manual ou queries paralelas para precisão
    });

    // Query para Dogões Confirmados (Pagos)
    const paidItems = await this.prisma.orderItem.count({
      where: {
        order: {
          sellerId: sellerId,
          paymentStatus: PaymentStatusEnum.PAID, // Ajuste para seu Enum de status pago
          active: true,
        },
      },
    });

    // Query para Dogões Pendentes (Aguardando Pagamento)
    const pendingItems = await this.prisma.orderItem.count({
      where: {
        order: {
          sellerId: sellerId,
          paymentStatus: PaymentStatusEnum.PENDING, // Ajuste para seu Enum
          active: true,
        },
      },
    });

    // Valor total arrecadado (Soma dos unitPrice dos itens pagos)
    const totalValue = await this.prisma.orderItem.aggregate({
      where: {
        order: {
          sellerId: sellerId,
          paymentStatus: PaymentStatusEnum.PAID,
          active: true,
        },
      },
      _sum: {
        unitPrice: true,
      },
    });

    return {
      paidItems,
      pendingItems,
      totalValue: totalValue._sum.unitPrice || 0,
    };
  }
}
