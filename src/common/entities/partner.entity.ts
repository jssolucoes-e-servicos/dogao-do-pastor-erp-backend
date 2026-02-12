// src/common/entities/partner.entity.ts

export class PartnerEntity {
  id: string;
  name: string;
  cnpj: string;
  phone: string;
  description?: string | null;
  website?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  addressInLine: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  complement?: string | null;
  responsibleName: string;
  responsiblePhone: string;
  logo?: string | null;
  approved: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}
