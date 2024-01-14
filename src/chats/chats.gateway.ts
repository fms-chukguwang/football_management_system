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

@WebSocketGateway({
  namespace: 'chats',
})
export class ChatsGateway implements OnGatewayConnection {
  constructor(
    private readonly chatsService: ChatsService,
    private readonly messagesService: ChatMessagesService,
  ) {}
  @WebSocketServer()
  server: Server;

  handleConnection(socket: Socket) {
    console.log(`on connection: ${socket.id}`);
  }

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

  @SubscribeMessage('create_chat')
  async createChat(
    @MessageBody() createChatDto: CreateChatDto,
    @ConnectedSocket() socket: Socket,
  ) {
    const chat = await this.chatsService.createChat(createChatDto);
  }

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
    const message = await this.messagesService.createMessage(creatMessagesDto);
    console.log(message);
    socket
      .to(message.chat.id.toString())
      .emit('receive_message', `${message.author.name}: ${message.message}`);
  }
}
