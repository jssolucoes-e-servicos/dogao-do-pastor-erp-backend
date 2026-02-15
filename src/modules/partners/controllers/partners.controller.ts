import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { FormDataRequest } from 'nestjs-form-data';
import { IdParamDto } from 'src/common/dto/id.param.dto';
import { inviteSendWhatsappDTO } from '../dto/invite-sendwhatsapp.dto';
import { RegisterPartnerDto } from '../dto/register-partner.dto';
import { UpdatePartnerDto } from '../dto/update-partner.dto';
import { UploadLogoDto } from '../dto/upload-logo.dto';
import { PartnersService } from '../services/partners.service';

@Controller('partners')
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
  async register(
    @Param() { id }: IdParamDto,
    @Body() data: RegisterPartnerDto,
  ) {
    return this.service.register(id, data);
  }

  @Get('verify-link/:id')
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
  async listForOrders() {
    return await this.service.listForOrders();
  }

  @Get('all')
  async listAll() {
    return await this.service.listAll();
  }

  @Post('invite/generate')
  async inviteGenerate() {
    return await this.service.inviteGenerate();
  }

  @Post('invite/send-whatsapp')
  async inviteSendWhatsapp(@Body() dto: inviteSendWhatsappDTO) {
    return await this.service.inviteSendWhatsapp(dto);
  }
}
