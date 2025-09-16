import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';
import { CustomerWithAddressRetriveDTO } from '../dto/customer-whit-address-retrieve.dto';
import { OnlyCPFRequestDTO } from '../dto/only-cpf-request.dto';

@Injectable()
export class CustomerService {
  constructor(private prisma: PrismaService) {
    /* void */
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
    console.log(customer);
    return customer;
  }
}
