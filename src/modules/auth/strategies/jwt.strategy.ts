import { JWTPayload } from './../interfaces/jwt.interface';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        JwtStrategy.extractJWT,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),

      ignoreExpiration: false,
      secretOrKey: process.env.SECRET_JWT_KEY as string,
    });
  }

  private static extractJWT(req: Request): string | null {
    console.log(req.cookies);
    if (req.cookies && 'auth_token' in req.cookies && req.cookies.auth_token.length > 0) {
      return req.cookies.auth_token;
    }
    return null;
  }

  //return decoded token
  async validate(payload: JWTPayload) {
    return { id: payload.id, username: payload.email };
  }
}
