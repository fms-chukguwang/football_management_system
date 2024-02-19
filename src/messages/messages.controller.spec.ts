import { LoggingService } from 'src/logging/logging.service';
import { MessagesController } from './messages.controller';
import { ChatMessagesService } from './messages.service';
import { Test, TestingModule } from '@nestjs/testing';
import { PaginateMessageDto } from './dto/paginate-message.dto';

describe('MessagesController', () => {
    let controller: MessagesController;
    let chatMessagesService: ChatMessagesService;
    let loggingService: LoggingService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [MessagesController],
            providers: [
                {
                    provide: ChatMessagesService,
                    useValue: {
                        paginateMessages: jest.fn(),
                    },
                },
                {
                    provide: LoggingService,
                    useValue: {
                        log: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<MessagesController>(MessagesController);
        chatMessagesService = module.get<ChatMessagesService>(ChatMessagesService);
        loggingService = module.get<LoggingService>(LoggingService);
    });

    describe('paginateMessages', () => {
        it('성공', async () => {
            const dto = new PaginateMessageDto();
            const chatId = 1;
            const mockData = {
                data: [],
                total: 0,
            };
            jest.spyOn(chatMessagesService, 'paginateMessages').mockResolvedValue(mockData);

            const result = await controller.paginateMessages(dto, chatId);
            expect(result).toEqual(mockData);
            expect(chatMessagesService.paginateMessages).toHaveBeenCalledWith(dto, chatId);
        });

        it('실패 _ chatId가 없는 경우', async () => {
            const dto = new PaginateMessageDto();
            const chatId = null;

            const result = await controller.paginateMessages(dto, chatId);
            expect(result).toBeNull();
            expect(loggingService.log).toHaveBeenCalledWith(
                `"uri": "chats/${chatId}/messages",
                "statuscode": 400,
                "message": 팀에 소속되지 않은 사용자가 채팅방에 접근하려고 시도했습니다.`,
            );
        });
    });
});
