import { Module } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';
import { WebhooksController } from 'src/modules/webhooks/controllers/webhooks.controller';
import { WebhooksService } from 'src/modules/webhooks/services/webhooks.service';

@Module({
  imports: [],
  controllers: [WebhooksController],
  providers: [PrismaService, WebhooksService],
})
export class WebhooksModule {
  /* void */
}
