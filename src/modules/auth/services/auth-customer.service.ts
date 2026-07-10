import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import {
  BaseService,
  ConfigService,
  LoggerService,
  PrismaService,
} from 'src/common/helpers/importer.helper';
import { LoginDto } from 'src/modules/auth/dto/login.dto';

@Injectable()
export class AuthCustomerService extends BaseService {
  constructor(
    configService: ConfigService,
    loggerService: LoggerService,
    prismaService: PrismaService,
    private readonly jwtService: JwtService,
  ) {
    super(configService, loggerService, prismaService);
  }

  async login(data: LoginDto) {
    // Limpa pontuações do CPF para buscar no banco de dados (somente dígitos)
    const cleanUsername = data.username.replace(/\D/g, '');
    const customer = await this.prisma.customer.findFirst({
      where: {
        cpf: cleanUsername,
        active: true,
        deletedAt: null,
      },
    });

    if (!customer) {
      throw new UnauthorizedException(
        'Credenciais inválidas ou conta inativa.',
      );
    }

    // 2. Valida a senha
    const isPasswordValid = await bcrypt.compare(
      data.password,
      customer.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    // 3. Gera o Payload do JWT
    const payload = {
      sub: customer.id,
      username: customer.cpf,
      type: 'CUSTOMER',
      name: customer.name,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        ...customer,
        type: 'CUSTOMER',
      },
    };
  }
}
