import {
  ConfigService,
  LoggerService,
  PrismaService,
} from '@/common/helpers/importer-helper';
import { BaseService } from '@/common/services/base.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';

export interface PermissionPayload {
  module: string; // module.ctrl
  access: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
  report: boolean;
}

export interface AuthPayload {
  sub: string; // user id
  username: string;
  roles: string[]; // role names
  permissions: PermissionPayload[]; // merged permissions (role + user)
}

@Injectable()
export class AuthService extends BaseService {
  constructor(
    loggerService: LoggerService,
    prismaService: PrismaService,
    private readonly config: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    super(loggerService, prismaService, config);
  }

  async resetAllPasswords() {
    const newPassword = 'dogao@2025';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const result = await this.prisma.user.updateMany({
      data: { password: hashedPassword },
    });

    console.log(
      `🔐 Senhas atualizadas com sucesso! Usuários afetados: ${result.count}`,
    );
    return result;
  }

  // Validate username/password
  async validateUser(username: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: { username, active: true },
      select: { id: true, username: true, password: true, name: true },
    });

    if (!user) return null;

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return null;

    return { id: user.id, username: user.username, name: user.name };
  }

  // Build merged permissions (role permissions + user permissions)
  private async buildPermissionsForUser(userId: string) {
    // 1) fetch user direct permissions
    const userPerms = await this.prisma.permission.findMany({
      where: { userId, active: true },
      include: { module: true },
    });

    // 2) fetch user's roles
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });
    const roleIds = userRoles.map((r) => r.roleId);

    // 3) fetch permissions associated to roles
    const rolePerms = roleIds.length
      ? await this.prisma.permission.findMany({
        where: { roleId: { in: roleIds }, active: true },
        include: { module: true },
      })
      : [];

    // 4) merge: group by module.ctrl
    const map = new Map<string, PermissionPayload>();

    const pushPerm = (p: any) => {
      const moduleCtrl = p.module?.ctrl ?? p.module?.name ?? 'unknown';
      const existing = map.get(moduleCtrl) ?? {
        module: moduleCtrl,
        access: false,
        create: false,
        update: false,
        delete: false,
        report: false,
      };
      existing.access = existing.access || !!p.access;
      existing.create = existing.create || !!p.create;
      existing.update = existing.update || !!p.update;
      existing.delete = existing.delete || !!p.delete;
      existing.report = existing.report || !!p.report;
      map.set(moduleCtrl, existing);
    };

    for (const p of rolePerms) pushPerm(p);
    for (const p of userPerms) pushPerm(p); // user perms override/augment roles

    return Array.from(map.values());
  }

  // Login: validate, build payload and sign token
  async login(username: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: { username, active: true },
      select: { id: true, username: true, name: true },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isValid = await this.validateUser(username, password);
    if (!isValid) throw new UnauthorizedException('Invalid credentials');

    // roles names
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId: user.id, AND: { active: true } },
      include: { role: true },
    });
    const roles = userRoles.map((r) => r.role.name);

    // build merged permissions
    const permissions = await this.buildPermissionsForUser(user.id);

    const payload: AuthPayload = {
      sub: user.id,
      username: user.username,
      roles,
      permissions,
    };

    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        roles,
        permissions,
      },
    };
  }

  // Optional: create hash and register user (dev usage)
  async hashPassword(plain: string) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(plain, salt);
  }

  // Optional register (if you need it)
  async register(data: { username: string; password: string; name: string }) {
    const hashed = await this.hashPassword(data.password);
    const user = await this.prisma.user.create({
      data: { username: data.username, password: hashed, name: data.name },
    });
    return user;
  }

  // helper to decode token and return payload (if needed)
  decodeToken(token: string) {
    return this.jwtService.decode(token);
  }
}
