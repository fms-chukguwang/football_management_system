import { Controller, Get, Param, Query } from '@nestjs/common';
import { ChatMessagesService } from './messages.service';
import { PaginateMessageDto } from './dto/paginate-message.dto';
import { LoggingService } from 'src/logging/logging.service';

@Controller('chats/:chatId/messages')
export class MessagesController {
    constructor(
        private readonly chatMessagesService: ChatMessagesService,
        private readonly loggingService: LoggingService,
    ) {}

    @Get()
    async paginateMessages(@Query() dto: PaginateMessageDto, @Param('chatId') chatId: number) {
        if (!chatId) {
            this.loggingService.log(
                `"uri": "chats/${chatId}/messages",
                "statuscode": 400,
                "message": 팀에 소속되지 않은 사용자가 채팅방에 접근하려고 시도했습니다.`,
            );
            return null;
        }
        const data = await this.chatMessagesService.paginateMessages(dto, chatId);
        return data;
    }
}
