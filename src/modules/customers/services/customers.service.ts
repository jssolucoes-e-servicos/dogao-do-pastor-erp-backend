import { ConflictException, Injectable } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { CustomerEntity } from 'src/common/entities';
import {
  BaseCrudService,
  ConfigService,
  LoggerService,
  PrismaBase,
  PrismaService,
} from 'src/common/helpers/importer.helper';
import { IPaginatedResponse } from 'src/common/interfaces';
import { CreateCustomerDto } from 'src/modules/customers/dto/create-customer.dto';
import { FindCpfCustomerDto } from 'src/modules/customers/dto/find-cpf-customer.dto';
import { UpdateCustomerDto } from 'src/modules/customers/dto/update-customer.dto';

@Injectable()
export class CustomersService extends BaseCrudService<
  CustomerEntity,
  CreateCustomerDto,
  UpdateCustomerDto,
  PrismaBase.CustomerDelegate
> {
  protected model: PrismaBase.CustomerDelegate;

  constructor(
    configService: ConfigService,
    loggerService: LoggerService,
    prismaService: PrismaService,
  ) {
    super(configService, loggerService, prismaService);
    this.model = this.prisma.customer;
  }

  private async validateCreate(dto: CreateCustomerDto): Promise<void> {
    const or: PrismaBase.CustomerWhereInput[] = [];

    if (dto.name) {
      or.push({ name: dto.name });
    }

    if (!or.length) return;

    const exists = await this.model.findFirst({
      where: { OR: or },
    });

    if (!exists) return;

    if (exists.name === dto.name) {
      throw new ConflictException(
        `Já existe um Cliente cadastrado com o nome "${dto.name}"`,
      );
    }
  }

  async create(dto: CreateCustomerDto): Promise<CustomerEntity> {
    await this.validateCreate(dto);
    const password = await bcrypt.hash('dogao@2026', 10);
    return this.model.create({
      data: {
        ...dto,
        password,
      },
    }) as unknown as CustomerEntity;
  }

  async autoCreate(dto: FindCpfCustomerDto): Promise<CustomerEntity> {
    const hasCustomer = await this.findByCPF(dto);
    if (hasCustomer) {
      return hasCustomer;
    } else {
      const password = await bcrypt.hash('dogao@2026', 10);
      const customer = await this.model.create({
        data: {
          name: `CLIENTE - ${dto.cpf}`,
          phone: '',
          cpf: dto.cpf,
          password: password,
          knowsChurch: true,
          allowsChurch: true,
          firstRegister: true,
        },
      });
      return customer;
    }
  }

  async list(
    query: PaginationQueryDto,
  ): Promise<IPaginatedResponse<CustomerEntity>> {
    const { search } = query;

    return this.paginate(query, {
      where: search
        ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } },
            { cpf: { contains: search } },
          ],
        }
        : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<CustomerEntity> {
    return super.findById(id);
  }

  async findByCPF(data: FindCpfCustomerDto): Promise<CustomerEntity> {
    const customer = await super.findOne({ cpf: data.cpf });
    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<CustomerEntity> {
    return super.update(id, {
      firstRegister: false,
      ...dto,
    });
  }

  async remove(id: string): Promise<CustomerEntity> {
    return super.softDelete({ id });
  }

  async restore(id: string): Promise<CustomerEntity> {
    return super.restoreData({ id });
  }
}
