import { Controller, Get, Param } from '@nestjs/common';
import { ChatMessagesService } from './messages.service';

@Controller('chats/:chatId/messages')
export class MessagesController {
  constructor(private readonly chatMessagesService: ChatMessagesService) {}

  @Get()
  getAllMessages(@Param('chatId') chatId: number) {
    return this.chatMessagesService.getAllMessages(chatId);
  }
}
