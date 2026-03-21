import { Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

const BATCH_SIZE = 1000;

@Controller('admin/seed-tickets')
@ApiTags('Admin - Seed Tickets')
export class SeedTicketsController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  @ApiOperation({
    summary: 'Cria 1000 tickets para a edição ativa se ainda não existirem',
  })
  async seedTickets() {
    const edition = await this.prisma.edition.findFirst({
      where: { active: true, deletedAt: null },
    });

    if (!edition) {
      return { success: false, message: 'Nenhuma edição ativa encontrada' };
    }

    const existing = await this.prisma.ticket.count({
      where: { editionId: edition.id, active: true },
    });

    if (existing > 0) {
      return {
        success: false,
        message: `Edição já possui ${existing} tickets cadastrados`,
        editionId: edition.id,
        editionName: edition.name,
        existing,
      };
    }

    // Tenta tag 'dogao' primeiro, senão pega qualquer seller ativo
    const seller =
      (await this.prisma.seller.findFirst({ where: { tag: 'dogao' } })) ??
      (await this.prisma.seller.findFirst({ where: { active: true, deletedAt: null } }));

    const finalSeller = seller;

    if (!finalSeller) {
      return {
        success: false,
        message: 'Nenhum vendedor encontrado no sistema',
      };
    }

    const tickets = Array.from({ length: BATCH_SIZE }, (_, i) => ({
      editionId: edition.id,
      sellerId: finalSeller.id,
      number: String(i + 1),
    }));

    await this.prisma.ticket.createMany({ data: tickets });

    return {
      success: true,
      message: `${BATCH_SIZE} tickets criados com sucesso`,
      editionId: edition.id,
      editionName: edition.name,
      created: BATCH_SIZE,
    };
  }

  @Post('status')
  @ApiOperation({ summary: 'Retorna status dos tickets da edição ativa' })
  async status() {
    const edition = await this.prisma.edition.findFirst({
      where: { active: true, deletedAt: null },
    });

    if (!edition) {
      return { success: false, message: 'Nenhuma edição ativa encontrada' };
    }

    const total = await this.prisma.ticket.count({
      where: { editionId: edition.id, active: true },
    });

    const used = await this.prisma.ticket.count({
      where: { editionId: edition.id, active: true, ordered: true },
    });

    return {
      success: true,
      editionId: edition.id,
      editionName: edition.name,
      total,
      used,
      available: total - used,
    };
  }
}
