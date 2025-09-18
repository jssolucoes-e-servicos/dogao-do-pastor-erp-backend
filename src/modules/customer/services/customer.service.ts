import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';
import { CustomerCreateDTO } from '../dto/customer-create.dto';
import { CustomerRetrieve } from '../dto/customer-retrieve';
import { CustomerWithAddressRetriveDTO } from '../dto/customer-whit-address-retrieve.dto';
import { OnlyCPFRequestDTO } from '../dto/only-cpf-request.dto';

@Injectable()
export class CustomerService {
  constructor(private prisma: PrismaService) {
    /* void */
  }

  async proccessCustomerEntry(
    customerDTO: CustomerCreateDTO,
  ): Promise<CustomerRetrieve> {
    const existsCustomer = await this.prisma.customer.findUnique({
      where: { cpf: customerDTO.cpf },
    });
    if (!existsCustomer) {
      const customer = await this.create(customerDTO);
      return customer;
    } else {
      const customer = await this.update(customerDTO);
      return customer;
    }
  }

  async create(customerDTO: CustomerCreateDTO): Promise<CustomerRetrieve> {
    const customer = await this.prisma.customer.create({
      data: {
        cpf: customerDTO.cpf,
        name: customerDTO.name,
        email: customerDTO.email,
        phone: customerDTO.phone,
        knowsChurch: customerDTO.knowsChurch,
        allowsChurch: customerDTO.allowsChurch,
      },
    });
    return customer;
  }

  async update(customerDTO: CustomerCreateDTO): Promise<CustomerRetrieve> {
    const customer = await this.prisma.customer.update({
      where: { cpf: customerDTO.cpf },
      data: {
        cpf: customerDTO.cpf,
        name: customerDTO.name,
        email: customerDTO.email,
        phone: customerDTO.phone,
        knowsChurch: customerDTO.knowsChurch,
        allowsChurch: customerDTO.allowsChurch,
      },
    });
    return customer;
  }

  async findByCpf({
    cpf,
  }: OnlyCPFRequestDTO): Promise<CustomerWithAddressRetriveDTO | null> {
    const customer = await this.prisma.customer.findUnique({
      where: { cpf: cpf },
      include: {
        addresses: true,
      },
    });

    if (!customer) {
      throw new NotFoundException('Cliente não encontrado.');
    }
    return customer;
  }
}
