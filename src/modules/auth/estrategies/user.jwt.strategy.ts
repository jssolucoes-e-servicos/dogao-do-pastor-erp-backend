import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class UserJwtStrategy extends PassportStrategy(Strategy, 'user-jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET!, // Troque pelo seu segredo ou use variáveis de ambiente
    });
  }

  async validate(payload: any) {
    if (payload.type !== 'user') {
      return null;
    }
    return { userId: payload.sub, username: payload.username };
  }
}
