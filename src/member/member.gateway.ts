import { UseFilters } from '@nestjs/common';
import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { WsExceptionFilter } from 'src/common/exception-filter/ws.exception-filter';

@WebSocketGateway()
export class MemberGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;

    afterInit(server: Server) {
        console.log('WebSocket Initialized');
    }

    handleConnection(client: any, ...args: any[]) {
        console.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: any) {
        console.log(`Client disconnected: ${client.id}`);
    }

    @UseFilters(WsExceptionFilter)
    sendJoinMessage(teamId: number, userId: number) {}
}
