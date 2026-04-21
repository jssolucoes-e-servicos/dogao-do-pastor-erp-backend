import { Body, Controller, Delete, Get, Header, Param, Patch, Post, Put, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { PaginatedQuery } from 'src/common/decorators/paginated-query.decorator';
import { IdParamDto } from 'src/common/dto/id.param.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { OrderEntity } from 'src/common/entities';
import type { IPaginatedResponse, IUser } from 'src/common/interfaces';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { User } from 'src/common/decorators/user.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { AccessLinkGuard } from '../../auth/guards/access-link.guard';
import { DefinePaymetnDTO } from '../dto/define-payment.dto';
import { ForDeliveryDTO } from '../dto/for-delivery.dto';
import { ForDonationDTO } from '../dto/for-donation.dto';
import { InitOrderDto } from '../dto/init-order.dto';
import { OrderIdOnly } from '../dto/order-id-only.dto';
import { ResultForAnalysisDTO } from '../dto/result-for-analysis.dto';
import { SendToAnalysisDTO } from '../dto/send-to-analysis.dto';
import { SyncCustomerDTO } from '../dto/sync-customer.dto';
import { CreatePdvOrderDto } from '../dto/create-pdv-order.dto';
import { OrdersService } from '../services/orders.service';
import { OrderReceiptService } from '../services/order-receipt.service';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard, AccessLinkGuard)
export class OrdersController {
  constructor(
    private readonly service: OrdersService,
    private readonly receiptService: OrderReceiptService,
  ) {}

  @PaginatedQuery()
  async list(
    @Query() query: PaginationQueryDto,
    @User() user: IUser,
  ): Promise<IPaginatedResponse<OrderEntity>> {
    return this.service.list(query, user);
  }

  @PaginatedQuery({ route: 'pending-analysis' })
  @Roles('IT', 'ADMIN', 'FINANCE', 'RECEPTION')
  async pendingAnalysis(
    @Query() query: PaginationQueryDto,
  ): Promise<IPaginatedResponse<OrderEntity>> {
    return this.service.pendingAnalysis(query);
  }

  @PaginatedQuery({ route: 'donations-analysis' })
  @Roles('IT', 'ADMIN', 'FINANCE')
  async donationsForAnalysis(
    @Query() query: PaginationQueryDto,
  ): Promise<IPaginatedResponse<OrderEntity>> {
    return this.service.donationsForAnalysis(query);
  }

  @Post('init')
  @Public()
  async initOrder(@Body() dto: InitOrderDto) {
    return await this.service.initOrder(dto);
  }

  @Get(':id')
  @Public()
  async findById(@Param() { id }: IdParamDto) {
    return await this.service.findById(id);
  }

  @Post('by-customer/:id')
  async findByCustomerId(@Param() { id }: IdParamDto) {
    return await this.service.findByCustomerId(id);
  }

  @Post('by-seller/:id')
  async findBySellerId(@Param() { id }: IdParamDto) {
    return await this.service.findBySellerId(id);
  }

  @Post('by-edition/:id')
  async findByEditionId(@Param() { id }: IdParamDto) {
    return await this.service.findByEditionId(id);
  }

  @Put(':id')
  async update(@Param() { id }: IdParamDto, @Body() dto: any) {
    return await this.service.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param() { id }: IdParamDto) {
    return await this.service.remove(id);
  }

  @Post('restore/:id')
  async restore(@Param() { id }: IdParamDto) {
    return await this.service.restore(id);
  }

  @Post('up-step/:id')
  @Public()
  async upStep(@Param() { id }: IdParamDto): Promise<OrderEntity> {
    return this.service.upStep(id);
  }

  @Patch(':id/sync-customer')
  @Public()
  async syncCustomer(
    @Param() { id }: IdParamDto,
    @Body() dto: SyncCustomerDTO,
  ) {
    return this.service.update(id, {
      customerName: dto.name,
      customerPhone: dto.phone,
    });
  }

  @Post('define-payment')
  @Public()
  async definePayment(@Body() dto: DefinePaymetnDTO) {
    return this.service.definePayment(dto);
  }

  @Post('set-donation')
  @Public()
  async setDonation(@Body() dto: ForDonationDTO) {
    return await this.service.setDonation(dto);
  }

  @Post('set-delivery')
  @Public()
  async setDelivery(@Body() dto: ForDeliveryDTO) {
    return await this.service.setDelivery(dto);
  }

  @Post('set-pickup')
  @Public()
  async setPickup(@Body() dto: OrderIdOnly) {
    return await this.service.setPickup(dto);
  }

  @Post('send-to-analysis')
  async sendToAnalysis(@Body() dto: SendToAnalysisDTO) {
    return this.service.setAnalysisStatus(dto);
  }

  @Post('result-analysis')
  async resultAnalysis(@Body() dto: ResultForAnalysisDTO) {
    return this.service.resultAnalysis(dto);
  }

  @Post('change-payment-method')
  @Public()
  async changePaymentMethod(@Body() dto: OrderIdOnly) {
    return this.service.changePaymentMethod(dto.orderId);
  }

  @Post('downstep')
  @Public()
  async downstep(@Body() dto: OrderIdOnly) {
    return this.service.downstep(dto.orderId);
  }

  @Get('send-wpp-payment-received/:id')
  async sendPaymentReceive(@Param() { id }: IdParamDto) {
    return this.service.sendPaymentReceive(id);
  }

  @Post(':id/send-receipt')
  @Roles('T.I', 'Administração', 'Financeiro', 'Recepção', 'Vendedor', 'Líder de Célula', 'Supervisor de Rede')
  async sendReceipt(@Param() { id }: IdParamDto) {
    return this.service.sendPaymentReceive(id);
  }

  /** Finaliza venda em dinheiro: confirma que o troco foi dado e envia comprovante */
  @Post(':id/finalize-cash')
  @Roles('T.I', 'Administração', 'Financeiro', 'Recepção', 'Vendedor', 'Líder de Célula', 'Supervisor de Rede')
  async finalizeCash(@Param() { id }: IdParamDto) {
    return this.service.sendPaymentReceive(id);
  }

  @Post('create-pdv')
  @Roles('T.I', 'Administração', 'Financeiro', 'Recepção', 'Vendedor', 'Líder de Célula', 'Supervisor de Rede')
  async createPDV(@Body() dto: CreatePdvOrderDto, @User() user: IUser) {
    return this.service.createPDV(dto, user);
  }

  @Get('pending-pdv/:customerId')
  @Roles('T.I', 'Administração', 'Financeiro', 'Recepção', 'Vendedor', 'Líder de Célula', 'Supervisor de Rede')
  async pendingPdv(@Param('customerId') customerId: string) {
    return this.service.findPendingPdvByCustomer(customerId);
  }

  @Post(':id/send-pix-code')
  @Roles('T.I', 'Administração', 'Financeiro', 'Recepção', 'Vendedor', 'Líder de Célula', 'Supervisor de Rede')
  async sendPixCode(@Param() { id }: IdParamDto) {
    return this.service.sendPixCode(id);
  }

  @Get(':id/receipt.pdf')
  @Public()
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'inline; filename="comprovante.pdf"')
  async getReceipt(@Param() { id }: IdParamDto, @Res() res: Response) {
    const pdf = await this.receiptService.generateReceiptPdf(id);
    res.end(pdf);
  }
}
