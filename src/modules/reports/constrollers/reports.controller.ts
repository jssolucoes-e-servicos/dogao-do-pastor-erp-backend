import { Controller, Get } from '@nestjs/common';
import { SellerReportCache } from '../interfaces/SellerReportCache.interface';
import { ReportsService } from '../services/reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {
    /* void */
  }

  @Get('generate-solds')
  async generateReport(): Promise<SellerReportCache[]> {
    return await this.reportsService.generateReport();
  }

  @Get('send-solds')
  async sendReport(): Promise<void> {
    await this.reportsService.sendReportsIfChanged();
  }

/*   @Get('send-solds')
  async reportSoldsForSeller(@Param('sellerId') sellerId:string): Promise<void> {
    await this.reportsService.sendReportsIfChanged();
  } */
}
