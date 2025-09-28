import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';
import { CustomerAddressCreateDTO } from '../dto/customer-address-create.dto';
import { CustomerAddressRetrieve } from '../dto/customer-address-retrieve';

@Injectable()
export class CustomerAddressService {
  constructor(private prisma: PrismaService) {
    /* void */
  }

  async proccessAddressEntry(
    addressDTO: CustomerAddressCreateDTO,
  ): Promise<CustomerAddressRetrieve> {
    const existsAddress = await this.prisma.customerAddress.findFirst({
      where: {
        customerId: addressDTO.customerId,
        zipCode: addressDTO.zipCode,
        street: addressDTO.street,
        number: addressDTO.number,
      },
    });
    if (!existsAddress) {
      const address = await this.create(addressDTO);
      return address;
    } else {
      const address = await this.update(addressDTO, existsAddress.id);
      return address;
    }
  }

  async create(
    addressDTO: CustomerAddressCreateDTO,
  ): Promise<CustomerAddressRetrieve> {
    const address: CustomerAddressRetrieve =
      await this.prisma.customerAddress.create({
        data: {
          customerId: addressDTO.customerId,
          street: addressDTO.street,
          number: addressDTO.number,
          neighborhood: addressDTO.neighborhood,
          city: addressDTO.city,
          state: addressDTO.state,
          zipCode: addressDTO.zipCode,
          complement: addressDTO.complement,
        },
      });
    return address;
  }

  async update(
    addressDTO: CustomerAddressCreateDTO,
    addresId: string,
  ): Promise<CustomerAddressRetrieve> {
    const address: CustomerAddressRetrieve =
      await this.prisma.customerAddress.update({
        where: { id: addresId },
        data: {
          customerId: addressDTO.customerId,
          street: addressDTO.street,
          number: addressDTO.number,
          neighborhood: addressDTO.neighborhood,
          city: addressDTO.city,
          state: addressDTO.state,
          zipCode: addressDTO.zipCode,
          complement: addressDTO.complement,
        },
      });
    return address;
  }

  async findByCustomer(customerId: string): Promise<CustomerAddressRetrieve[]> {
    try {
      const addresses = await this.prisma.customerAddress.findMany({
        where: { customerId: customerId },
      });
      return addresses;
    } catch (error) {
      console.error(error);
      throw new Error('Erro no servidor');
    }
  }
}
