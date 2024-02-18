import { Repository } from 'typeorm';
import { ChatMessagesService } from './messages.service';
import { Message } from './entities/messages.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateMessagesDto } from './dto/create-message.dto';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CommonService } from 'src/common/common.service';
import { Chats } from 'src/chats/entities/chats.entity';
import { User } from 'src/user/entities/user.entity';
import { PaginateMessageDto } from './dto/paginate-message.dto';

describe('MessagesService', () => {
    let repository: Repository<Message>;
    let service: ChatMessagesService;
    let commonService: CommonService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ChatMessagesService,
                {
                    provide: getRepositoryToken(Message),
                    useValue: {
                        create: jest.fn(),
                        paginateMessages: jest.fn(),
                        save: jest.fn(),
                        findOne: jest.fn(),
                        find: jest.fn(),
                    },
                },
                {
                    provide: CommonService,
                    useValue: {
                        paginate: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<ChatMessagesService>(ChatMessagesService);
        repository = module.get<Repository<Message>>(getRepositoryToken(Message));
        commonService = module.get<CommonService>(CommonService);
    });

    describe('paginateMessages', () => {
        it('성공', async () => {
            const chatId = 1;
            const dto = new PaginateMessageDto();
            await service.paginateMessages(dto, chatId);
            expect(commonService.paginate).toHaveBeenCalledWith(
                dto,
                repository,
                {
                    where: {
                        chat: {
                            id: chatId,
                        },
                    },
                    relations: ['author'],
                },
                `chats/${chatId}/messages/`,
            );
        });
    });

    describe('getAllMessages', () => {
        it('성공', async () => {
            const chatId = 1;
            const chat1 = new Chats();
            chat1.id = chatId;
            const user1 = new User();
            user1.id = 1;
            const user2 = new User();
            user2.id = 2;
            const message1 = new Message();
            message1.id = 1;
            message1.chat = chat1;
            message1.author = user1;
            message1.author.password = 'password';

            const message2 = new Message();
            message2.id = 2;
            message2.chat = chat1;
            message2.author = user2;
            message2.author.password = 'password';

            jest.spyOn(repository, 'find').mockResolvedValue([message1, message2]);
            delete message1.author.password;
            delete message2.author.password;

            const expectedReturn = [message1, message2];
            const result = await service.getAllMessages(chatId);
            expect(result).toEqual(expectedReturn);
        });
    });

    describe('createMessage', () => {
        it('성공', async () => {
            const createMessageDto = {
                chatId: 1,
                message: 'This is a 시발 message',
            };
            const authorId = 1;
            const savedMessage = new Message();
            const chat = new Chats();
            const author = new User();
            author.id = authorId;
            chat.id = createMessageDto.chatId;
            savedMessage.id = 1;
            savedMessage.chat = chat;
            savedMessage.author = author;
            savedMessage.message = 'This is a ❤️❤️ message';

            jest.spyOn(repository, 'save').mockResolvedValue(savedMessage);
            jest.spyOn(repository, 'findOne').mockResolvedValue(savedMessage);

            const result = await service.createMessage(createMessageDto, authorId);

            expect(repository.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('❤️'),
                }),
            );
            expect(result).toEqual(savedMessage);
        });
    });
});
