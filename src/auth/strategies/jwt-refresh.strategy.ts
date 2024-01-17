import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt, VerifiedCallback } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { refreshTokenDto } from '../dtos/refresh-token.dto';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh-token',
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly redisService: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any, done: VerifiedCallback) {
    try {
      const refreshToken = req.headers['authorization'];
      console.log('JwtRefreshStrategy - Validating:', payload);
      const id = payload.id;
      console.log('JwtRefreshStrategy - Validation successful:', id);
      return { id, req };
    } catch (error) {
      console.error('JwtRefreshStrategy - Error in validate:', error);
      throw new UnauthorizedException('인증에 실패했습니다.');
    }
  }
}
