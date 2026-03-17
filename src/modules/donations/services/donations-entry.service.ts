import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { DonationEntryEntity } from 'src/common/entities';
import { CommandStatusEnum, DonationEntryTypeEnum, WithdrawalStatusEnum } from 'src/common/enums';
import { getActiveEdition } from 'src/common/helpers/edition-helper';
import {
  BaseCrudService,
  ConfigService,
  LoggerService,
  PrismaBase,
  PrismaService,
} from 'src/common/helpers/importer.helper';
import { WithdrawalCreateDTO } from '../dto/withdrawal-create.dto';

@Injectable()
export class DonationsEntryService extends BaseCrudService<
  DonationEntryEntity,
  any,
  any,
  PrismaBase.DonationEntryDelegate
> {
  protected model: PrismaBase.DonationEntryDelegate;

  constructor(
    configService: ConfigService,
    loggerService: LoggerService,
    prismaService: PrismaService,
  ) {
    super(configService, loggerService, prismaService);
    this.model = this.prisma.donationEntry;
  }

  async getPartnerBalance(partnerId: string): Promise<number> {
    const result = await this.prisma.donationEntry.aggregate({
      where: {
        partnerId,
        active: true,
        deletedAt: null,
      },
      _sum: { quantity: true },
    });

    return result._sum.quantity || 0;
  }

  async listPartnersWithBalances() {
    // 1. Pegar todos os parceiros ativos e aprovados
    const partners = await this.prisma.partner.findMany({
      where: {
        active: true,
        approved: true,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        responsibleName: true,
        phone: true,
        logo: true,
      }
    });

    // 2. Para cada parceiro, calcular o saldo atual
    // Nota: Em uma base muito grande, o ideal seria usar um groupBy ou campo calculado,
    // mas para a escala atual, percorrer os parceiros é seguro e simples.
    const partnersWithBalance = await Promise.all(
      partners.map(async (partner) => {
        const balance = await this.getPartnerBalance(partner.id);
        return {
          ...partner,
          balance,
        };
      })
    );

    return partnersWithBalance;
  }

  async listEntriesByPartner(partnerId: string, query: PaginationQueryDto) {
    const { page, perPage } = query;
    const skip = (page - 1) * perPage;

    const [data, total] = await Promise.all([
      this.prisma.donationEntry.findMany({
        where: { partnerId, deletedAt: null },
        include: {
          order: true,
          withdrawal: {
            include: { items: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: perPage,
        skip,
      }),
      this.prisma.donationEntry.count({
        where: { partnerId, deletedAt: null },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  async createWithdrawal(dto: WithdrawalCreateDTO) {
    const { partnerId, scheduledAt, items } = dto;
    const edition = await getActiveEdition(this.prisma);
    if (!edition) throw new NotFoundException('Nenhuma edição ativa.');

    const totalRequested = items.reduce((acc, item) => acc + item.quantity, 0);
    const currentBalance = await this.getPartnerBalance(partnerId);

    if (currentBalance < totalRequested) {
      throw new BadRequestException(`Saldo insuficiente (${currentBalance})`);
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Criar a Retirada
      const withdrawal = await tx.withdrawal.create({
        data: {
          partnerId,
          scheduledAt,
          status: WithdrawalStatusEnum.PENDING,
          items: {
            create: items.flatMap((item) =>
              // Criamos registros individuais se cada unidade puder ser diferente
              // ou mantemos agrupado conforme seu DTO
              Array(item.quantity)
                .fill(null)
                .map(() => ({
                  quantity: 1, // Transformando em unidades para facilitar produção
                  removedIngredients: item.removedIngredients,
                })),
            ),
          },
        },
        include: { items: true, partner: true },
      });

      // 2. Registrar Débito
      await tx.donationEntry.create({
        data: {
          partnerId,
          withdrawalId: withdrawal.id,
          quantity: -totalRequested,
          type: DonationEntryTypeEnum.DEBIT,
        },
      });

      // 3. Gerar Comandas (Uma para cada item da retirada)
      // Aqui pegamos a última sequência da edição para o sequentialId
      const lastCommand = await tx.command.findFirst({
        where: { editionId: edition.id },
        orderBy: { sequence: 'desc' },
      });

      let nextSequence = (lastCommand?.sequence || 0) + 1;

      // Gerar comandas para cada lanche da retirada
      for (const item of withdrawal.items) {
        const seqId = `${edition.code}${String(nextSequence).padStart(5, '0')}`;

        await tx.command.create({
          data: {
            sequentialId: seqId,
            withdrawalId: withdrawal.id,
            editionId: edition.id,
            editionCode: Number(edition.code),
            sequence: nextSequence,
            status: CommandStatusEnum.PENDING,
          },
        });
        nextSequence++;
      }

      return withdrawal;
    });
  }

  async addDonationFromOrder(
    orderId: string,
    partnerId: string,
    quantity: number,
  ) {
    return this.prisma.donationEntry.create({
      data: {
        orderId,
        partnerId,
        quantity, // Positivo para CREDIT
        type: DonationEntryTypeEnum.CREDIT,
      },
    });
  }
}
