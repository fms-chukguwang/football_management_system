import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtService } from '@nestjs/jwt';
import { extractTokenFromHeader } from '../../helpers/auth.helper';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly jwtService: JwtService) {
    super();
  }

  handleRequest(err, user, info: Error) {
    if (err || !user) {
      console.log('JwtAuthGuard - Unauthorized:', info?.message);
      throw err || new UnauthorizedException('Unauthorized');
    }
    console.log('JwtAuthGuard - User authenticated:', user);
    return user;
  }
}
