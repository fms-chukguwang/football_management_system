import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { refreshTokenDto } from '../dtos/refresh-token.dto';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh-token',
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    try {
      console.log('JwtRefreshStrategy - Validating:', payload);

      const id = payload.id
      console.log('JwtRefreshStrategy - Validation successful:', id);
      return {id};
    } catch (error) {
      console.error('JwtRefreshStrategy - Error in validate:', error);
      throw new UnauthorizedException('인증에 실패했습니다.');
    }
  }
}
