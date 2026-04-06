import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { IdParamDto } from 'src/common/dto/id.param.dto';
import { WithdrawalCreateDTO } from '../dto/withdrawal-create.dto';
import { DonationsEntryService } from '../services/donations-entry.service';

@Controller('donations')
export class DonationsController {
  constructor(private readonly donationsEntryService: DonationsEntryService) {
    /* void */
  }

  @Get('get-balance/:id')
  async getPartnerBalance(@Param() { id }: IdParamDto) {
    return this.donationsEntryService.getPartnerBalance(id);
  }

  @Post('create-withdrawal')
  async createWithdrawal(@Body() dto: WithdrawalCreateDTO) {
    return await this.donationsEntryService.createWithdrawal(dto);
  }

  @Get('partners-balances')
  async listPartnersWithBalances() {
    return this.donationsEntryService.listPartnersWithBalances();
  }

  @Get('partner-entries/:id')
  async listEntriesByPartner(
    @Param() { id }: IdParamDto,
    @Query() query: PaginationQueryDto,
  ) {
    return this.donationsEntryService.listEntriesByPartner(id, query);
  }

  @Get('withdrawals/:partnerId')
  async listWithdrawalsByPartner(@Param('partnerId') partnerId: string) {
    return this.donationsEntryService.listWithdrawalsByPartner(partnerId);
  }

  @Get('withdrawal/:id')
  async getWithdrawal(@Param('id') id: string) {
    return this.donationsEntryService.getWithdrawal(id);
  }
}
