import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  BaseCrudService,
  ConfigService,
  LoggerService,
  PrismaBase,
  PrismaService,
} from 'src/common/helpers/importer.helper';

@Injectable()
export class TicketsService extends BaseCrudService<any, any, any, PrismaBase.TicketDelegate> {
  protected model: PrismaBase.TicketDelegate;

  constructor(
    configService: ConfigService,
    loggerService: LoggerService,
    prismaService: PrismaService,
  ) {
    super(configService, loggerService, prismaService);
    this.model = this.prisma.ticket;
  }

  async validateTicket(number: string, editionId: string) {
    const ticket = await this.model.findFirst({
      where: {
        number,
        editionId,
        active: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket #${number} não encontrado para esta edição`);
    }

    if (ticket.ordered) {
      throw new BadRequestException(`Ticket #${number} já foi utilizado no pedido ${ticket.orderId}`);
    }

    return ticket;
  }
}
