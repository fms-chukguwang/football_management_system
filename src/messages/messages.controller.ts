import { Controller, Get, Param, Query } from '@nestjs/common';
import { ChatMessagesService } from './messages.service';
import { PaginateMessageDto } from './dto/paginate-message.dto';

@Controller('chats/:chatId/messages')
export class MessagesController {
    constructor(private readonly chatMessagesService: ChatMessagesService) {}

    // @Get()
    // getAllMessages(@Param('chatId') chatId: number) {
    //     return this.chatMessagesService.getAllMessages(chatId);
    // }

    @Get()
    paginateMessages(@Query() dto: PaginateMessageDto, @Param('chatId') chatId: number) {
        return this.chatMessagesService.paginateMessages(dto, chatId);
    }
}
