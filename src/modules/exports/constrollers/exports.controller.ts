import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ExportsService } from '../services/exports.service';

@Controller('exports')
export class ExportsController {
  constructor(private readonly service: ExportsService) {
    /* void */
  }

  @Get('orders')
  async exportOrdersExcel(@Res() res: Response) {
    return this.service.exportOrdersExcel(res);
  }
}
