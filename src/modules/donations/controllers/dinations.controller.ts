import { Controller, Get, Param, Post } from '@nestjs/common';
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
  async createWithdrawal(dto: WithdrawalCreateDTO) {
    return await this.donationsEntryService.createWithdrawal(dto);
  }
}
