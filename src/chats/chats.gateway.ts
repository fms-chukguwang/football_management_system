import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CreateChatDto } from './dto/create-chat.dto';
import { ChatsService } from './chats.service';
import { EnterChatDto } from './dto/enter-chat.dto';
import { CreateMessagesDto } from '../messages/dto/create-message.dto';
import { ChatMessagesService } from '../messages/messages.service';
import { UseFilters, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { WsExceptionFilter } from '../common/exception-filter/ws.exception-filter';
import { SocketBearerTokenGuard } from './guard/ws-bearer-token.guard';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { UserService } from '../user/user.service';
@WebSocketGateway({
    namespace: /^\/chats\/.+$/,
})
export class ChatsGateway implements OnGatewayConnection {
    constructor(
        private readonly chatsService: ChatsService,
        private readonly messagesService: ChatMessagesService,
        private readonly configService: ConfigService,
        private readonly userService: UserService,
    ) {}
    @WebSocketServer()
    server: Server;

    @UseGuards(SocketBearerTokenGuard)
    handleConnection(socket: Socket) {
        console.log(`handleConnection: ${socket.id}`);
        const token = socket.handshake.query.token;
        if (!token) {
            throw new WsException('Token not found');
        }
        try {
            const jwtSecret = this.configService.get<string>('JWT_SECRET');
            if (typeof jwtSecret !== 'string') {
                throw new Error('JWT_SECRET is not a string');
            }
            const decoded = jwt.verify(token as string, jwtSecret);
            socket['userId'] = decoded['id'];
            const namespace = socket.nsp;
            console.log('namespace: ', namespace.name);
            const roomId = namespace.name.split('/')[2];
            console.log(`roomId: ${roomId}`);
            this.enterRoom({ teamId: Number(roomId) }, socket);
            console.log('룸에 입장했습니다.');

            return true;
        } catch (e) {
            socket.disconnect();
        }
    }

    @UsePipes(
        new ValidationPipe({
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: true,
        }),
    )
    @UseFilters(WsExceptionFilter)
    @SubscribeMessage('create_chat')
    async createChat(
        @MessageBody() createChatDto: CreateChatDto,
        @ConnectedSocket() socket: Socket,
    ) {
        const chat = await this.chatsService.createChat(createChatDto);
    }

    @UsePipes(
        new ValidationPipe({
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: true,
        }),
    )
    @UseFilters(WsExceptionFilter)
    @SubscribeMessage('enter_room')
    async enterRoom(@MessageBody() room: EnterChatDto, @ConnectedSocket() socket: Socket) {
        const exists = await this.chatsService.checkIdChatExists(room.teamId);
        if (!exists) {
            throw new WsException({
                statusCode: 404,
                message: `${room.teamId}번 채팅방은 존재하지 않습니다.`,
            });
        }
        socket.join(room.teamId.toString());
    }

    @UsePipes(
        new ValidationPipe({
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: true,
        }),
    )

    // 팀에 들어오면, 팀에 들어온 사실을 알리는 메소드
    @UseFilters(WsExceptionFilter)
    @SubscribeMessage('enter_team')
    async enterTeam(teamId: number, userId: number) {
        const newUser = await this.userService.findOneById(userId);

        this.server.to(teamId.toString()).emit('enter_team', {
            message: `${newUser.name}님이 팀에 들어왔습니다.`,
        });
    }

    @UsePipes(
        new ValidationPipe({
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: true,
        }),
    )
    @UseFilters(WsExceptionFilter)
    @SubscribeMessage('kick_out')
    async kickOut(
        @MessageBody() payload: { chatId: number; targetUserId: number },
        @ConnectedSocket() socket: Socket,
    ) {
        // userId와 socket이 서로 일치해야함
        const { chatId, targetUserId } = payload;
        const exists = await this.chatsService.checkIdChatExists(chatId);

        // 방이 존재하는지 확인(나중엔 팀으로 변경)
        if (!exists) {
            throw new WsException({
                statusCode: 404,
                message: `${chatId}번 채팅방은 존재하지 않습니다.`,
            });
        }

        // 내가 팀에 속해있어야 함
        const isMember = await this.chatsService.checkMember(chatId, socket['userId']);

        if (!isMember) {
            throw new WsException({
                statusCode: 403,
                message: `현재 본인이 ${chatId}번 채팅방에 속해있지 않습니다.`,
            });
        }

        // 내가 구단주인지 확인

        // 내보내려는 사람이 방에 속해있는지 확인
        const isTargetUserInChat = await this.chatsService.checkMember(chatId, targetUserId);

        if (!isTargetUserInChat) {
            throw new WsException({
                statusCode: 403,
                message: `${targetUserId}번 유저는 ${chatId}번 채팅방에 속해있지 않습니다.`,
            });
        }
        try {
            await this.chatsService.leaveChat(chatId, targetUserId);
            return true;
        } catch (error) {
            throw new WsException({
                statusCode: 401,
                message: '유저 강퇴에 실패했습니다.',
            });
        }
    }

    @UsePipes(
        new ValidationPipe({
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: true,
        }),
    )
    // 내가 나가고 싶은 방 번호를 보내면, 그 방에서 나가게 해주는 메소드
    @UseFilters(WsExceptionFilter)
    @SubscribeMessage('leave_room')
    async leaveRoom(@MessageBody() payload: { chatId: number }, @ConnectedSocket() socket: Socket) {
        const { chatId } = payload;
        const exists = await this.chatsService.checkIdChatExists(chatId);
        // 내가 그 방에 속해있는지 확인
        const isMember = await this.chatsService.checkMember(chatId, socket['userId']);
        if (!isMember) {
            throw new WsException({
                statusCode: 403,
                message: `${chatId}번 채팅방에 속해있지 않습니다.`,
            });
        }
        if (!exists) {
            throw new WsException({
                statusCode: 404,
                message: `${chatId}번 채팅방은 존재하지 않습니다.`,
            });
        }
        await this.chatsService.leaveChat(chatId, socket['userId']);
        socket.leave(chatId.toString());
        console.log(`leave_room: ${socket.id}`);
    }

    @UsePipes(
        new ValidationPipe({
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: true,
        }),
    )
    @UseFilters(WsExceptionFilter)
    @SubscribeMessage('send_message')
    async sendMessage(
        @MessageBody() creatMessagesDto: CreateMessagesDto,
        @ConnectedSocket() socket: Socket,
    ) {
        const chatExists = await this.chatsService.checkIdChatExists(creatMessagesDto.chatId);
        if (!chatExists) {
            throw new WsException({
                statusCode: 404,
                message: `${creatMessagesDto.chatId}번 채팅방은 존재하지 않습니다.`,
            });
        }

        const message = await this.messagesService.createMessage(
            creatMessagesDto,
            socket['userId'],
        );

        socket.to(message.chat.id.toString()).emit('receive_message', {
            id: message.id,
            author: {
                id: message.author.id,
                name: message.author.name,
                email: message.author.email,
            },
            message: message.message,
            createdAt: message.createdAt,
        });
    }
}
