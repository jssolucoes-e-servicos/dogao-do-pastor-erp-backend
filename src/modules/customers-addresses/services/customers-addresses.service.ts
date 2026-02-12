import { Injectable } from '@nestjs/common';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { CustomerAddressEntity } from 'src/common/entities';
import {
  BaseCrudService,
  ConfigService,
  LoggerService,
  PrismaBase,
  PrismaService,
} from 'src/common/helpers/importer.helper';
import { IPaginatedResponse } from 'src/common/interfaces';
import { CreateCustomerAddressDto } from '../dto/create-customer-address.dto';
import { FindByCepDto } from '../dto/find-by-cep.dto';
import { FindByCustomerDto } from '../dto/find-by-customer.dto';
import { UpdateCustomerAddressDto } from '../dto/update-customer-address.dto';

@Injectable()
export class CustomersAddressesService extends BaseCrudService<
  CustomerAddressEntity,
  CreateCustomerAddressDto,
  UpdateCustomerAddressDto,
  PrismaBase.CustomerAddressDelegate
> {
  protected model: PrismaBase.CustomerAddressDelegate;

  constructor(
    configService: ConfigService,
    loggerService: LoggerService,
    prismaService: PrismaService,
  ) {
    super(configService, loggerService, prismaService);
    this.model = this.prisma.customerAddress;
  }

  async create(dto: CreateCustomerAddressDto): Promise<CustomerAddressEntity> {
    return (await super.create(dto)) as unknown as CustomerAddressEntity;
  }

  async list(
    query: PaginationQueryDto,
  ): Promise<IPaginatedResponse<CustomerAddressEntity>> {
    return this.paginate(query, {
      orderBy: { neighborhood: 'asc' },
    });
  }

  async findById(id: string): Promise<CustomerAddressEntity> {
    return super.findById(id);
  }

  async findByCustomer(
    data: FindByCustomerDto,
  ): Promise<CustomerAddressEntity[]> {
    const address = await this.model.findMany({
      where: {
        customerId: data.customerId,
      },
    });
    return address;
  }

  async findByCEP(data: FindByCepDto): Promise<CustomerAddressEntity[]> {
    const address = await this.model.findMany({
      where: { zipCode: data.zipCode },
    });
    return address;
  }

  async update(
    id: string,
    dto: UpdateCustomerAddressDto,
  ): Promise<CustomerAddressEntity> {
    return super.update(id, dto);
  }

  async remove(id: string): Promise<CustomerAddressEntity> {
    return super.softDelete({ id });
  }

  async restore(id: string): Promise<CustomerAddressEntity> {
    return super.restoreData({ id });
  }
}
