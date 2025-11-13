import { IGetSaleBySeller } from '@/common/interfaces';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { ICountSoldsWithRank } from '../../../common/interfaces/count-solds-with-rank.interface';
import { BySellerTagDTO } from '../dto/by-seller-tag.dto';
import { SendReportByTagDTO } from '../dto/send-report-by-tag.dto';
import { SendReportWhastappDTO } from '../dto/send-report-whatsapp.dto';
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

  @Get('count-solds')
  async getCountAllSolds(): Promise<ICountSoldsWithRank> {
    return await this.reportsService.getCountAllSolds();
  }

  @Post('send-ranking')
  async sendSalesReportToWhatsapp(
    @Body() body: SendReportWhastappDTO,
  ): Promise<void> {
    return await this.reportsService.sendSalesReportToWhatsapp(body);
  }

  @Post('get-sales-by-tag')
  async getSalesBySellerTag(
    @Body() body: BySellerTagDTO,
  ): Promise<IGetSaleBySeller> {
    return await this.reportsService.getSalesBySellerTag(body.tag);
  }
  @Post('send-sales-by-tag')
  async sendSalesBySellerTagToWhatsapp(
    @Body() body: SendReportByTagDTO,
  ): Promise<void> {
    return await this.reportsService.sendSalesBySellerTagToWhatsapp(body);
  }

  @Get()
  async sendAllSellersSalesReports(): Promise<{
    totalSellers: number;
    success: number;
    failed: number;
  }> {
    return await this.reportsService.sendAllSellersSalesReports();
  }

  /*   @Get('send-solds')
  async reportSoldsForSeller(@Param('sellerId') sellerId:string): Promise<void> {
    await this.reportsService.sendReportsIfChanged();
  } */
}
