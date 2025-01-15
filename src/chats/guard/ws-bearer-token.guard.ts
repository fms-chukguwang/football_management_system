import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

// token에 있는 유저 ID 갖고오기( 소켓에서! )
@Injectable()
export class SocketBearerTokenGuard implements CanActivate {
    constructor(private readonly configService: ConfigService) {}
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const socket = context.switchToWs().getClient();
        const headers = socket.handshake.headers;
        const bearerToken = headers['authorization'];
        const rawToken = bearerToken.split(' ')[1];
        if (!rawToken) {
            throw new WsException('Token not found');
        }
        try {
            const decoded = jwt.verify(rawToken, this.configService.get<string>('JWT_SECRET'));
            socket.userId = decoded['id'];
            return true;
        } catch (e) {
            throw new WsException('Token is invalid');
        }
    }
}
