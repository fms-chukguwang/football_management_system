// SocketIO가 연결하게 되는 곳을 우리가 Gateway라고 부른다.

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
import { CreateMessagesDto } from './messages/dto/create-message.dto';
import { ChatMessagesService } from './messages/messages.service';
import {
  UseFilters,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { WsExceptionFilter } from 'src/common/exception-filter/ws.exception-filter';
import { SocketBearerTokenGuard } from './guard/ws-bearer-token.guard';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

@WebSocketGateway({
  namespace: 'chats',
})
export class ChatsGateway implements OnGatewayConnection {
  constructor(
    private readonly chatsService: ChatsService,
    private readonly messagesService: ChatMessagesService,
    private readonly configService: ConfigService,
  ) {}
  @WebSocketServer()
  server: Server;

  @UseGuards(SocketBearerTokenGuard)
  handleConnection(socket: Socket) {
    console.log(`on connection: ${socket.id}`);

    const headers = socket.handshake.headers;
    const bearerToken = headers['authorization'];
    const rawToken = bearerToken.split(' ')[1];
    if (!rawToken) {
      throw new WsException('Token not found');
    }
    try {
      const decoded = jwt.verify(
        rawToken,
        this.configService.get<string>('JWT_SECRET'),
      );

      // 소켓은 한번 연결되면 정보가 유지됨
      socket['userId'] = decoded['id'];
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
  async enterRoom(
    @MessageBody() rooms: EnterChatDto,
    @ConnectedSocket() socket: Socket,
  ) {
    for (const chatId of rooms.chatIds) {
      const exists = await this.chatsService.checkIdChatExists(chatId);
      if (!exists) {
        throw new WsException({
          statusCode: 404,
          message: `${chatId}번 채팅방은 존재하지 않습니다.`,
        });
      }
    }
    socket.join(rooms.chatIds.map((chatId) => chatId.toString()));
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
  async kickOut() {}

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
  async leaveRoom(
    @MessageBody() payload: { chatId: number },
    @ConnectedSocket() socket: Socket,
  ) {
    const { chatId } = payload;
    const exists = await this.chatsService.checkIdChatExists(chatId);
    // 내가 그 방에 속해있는지 확인
    const isMember = await this.chatsService.checkMember(
      chatId,
      socket['userId'],
    );
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
    const chatExists = await this.chatsService.checkIdChatExists(
      creatMessagesDto.chatId,
    );
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
    socket
      .to(message.chat.id.toString())
      .emit('receive_message', `${message.author.name}: ${message.message}`);
  }
}
