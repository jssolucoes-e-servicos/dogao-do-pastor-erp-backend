import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { User } from 'src/common/decorators/user.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { FormDataRequest } from 'nestjs-form-data';
import { PaginatedQuery } from 'src/common/decorators';
import { IdParamDto } from 'src/common/dto/id.param.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { inviteSendWhatsappDTO } from '../dto/invite-sendwhatsapp.dto';
import { RegisterPartnerDto } from '../dto/register-partner.dto';
import { UpdatePartnerDto } from '../dto/update-partner.dto';
import { UploadLogoDto } from '../dto/upload-logo.dto';
import { PartnersService } from '../services/partners.service';

@Controller('partners')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PartnersController {
  constructor(private readonly service: PartnersService) {}

  @Get('find/:id')
  async findOne(@Param() { id }: IdParamDto) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  async update(@Param() { id }: IdParamDto, @Body() data: UpdatePartnerDto) {
    return this.service.update(id, data);
  }

  @Post('register/:id')
  @Public()
  async register(
    @Param() { id }: IdParamDto,
    @Body() data: RegisterPartnerDto,
  ) {
    return this.service.register(id, data);
  }

  @Get('verify-link/:id')
  @Public()
  async verifyLink(@Param() { id }: IdParamDto) {
    return this.service.verifyLink(id);
  }

  @Post(':id/logo')
  @FormDataRequest() // Necessário para processar multipart/form-data
  async uploadLogo(
    @Param() { id }: IdParamDto,
    @Body() uploadLogoDto: UploadLogoDto,
  ) {
    return this.service.updateLogo(id, uploadLogoDto.logo);
  }

  @Get('for-orders')
  @Public()
  async listForOrders() {
    return await this.service.listForOrders();
  }

  @PaginatedQuery({ route: 'all' })
  @Roles('IT', 'ADMIN', 'FINANCE')
  async list(
    @Query() query: PaginationQueryDto,
    @User() user: any,
  ) {
    return await this.service.list(query, user);
  }

  @Post('invite/generate')
  async inviteGenerate() {
    return await this.service.inviteGenerate();
  }

  @Post('invite/send-whatsapp')
  async inviteSendWhatsapp(@Body() dto: inviteSendWhatsappDTO) {
    return await this.service.inviteSendWhatsapp(dto);
  }

  @Delete('delete/:id')
  async delete(@Param() { id }: IdParamDto) {
    return await this.service.delete(id);
  }
}
