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
      const address = await this.update(addressDTO);
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
  ): Promise<CustomerAddressRetrieve> {
    const address = await this.prisma.customerAddress.update({
      where: { cpf: addressDTO.cpf },
      data: {
        cpf: addressDTO.cpf,
        name: addressDTO.name,
        email: addressDTO.email,
        phone: addressDTO.phone,
        knowsChurch: addressDTO.knowsChurch,
        allowsChurch: addressDTO.allowsChurch,
      },
    });
    return address;
  }
}
