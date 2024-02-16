import { Test, TestingModule } from '@nestjs/testing';
import { ChatsController } from './chats.controller';
import { ChatsService } from './chats.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

describe('ChatsController', () => {
    let controller: ChatsController;
    let chatService: ChatsService;

    beforeEach(async () => {
        const mockChatService = {
            // paginateChat: jest.fn().mockImplementation((dto, userId) => {
            //     return {
            //         data: [],
            //         cursor: {
            //             after: 30,
            //         },
            //         count: 0,
            //         next: 'http://localhost:3001/api/chats?take=30&where__id__more_than=30',
            //     };
            // }),

            paginateChat: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [ChatsController],
            providers: [
                {
                    provide: ChatsService,
                    useValue: mockChatService,
                },
            ],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<ChatsController>(ChatsController);
        chatService = module.get<ChatsService>(ChatsService);
    });

    // 질문 : controller를 테스트할 때 인자가 정확히 전달되는 것이 중요한지, 반환하는 값이 중요한지 의문.
    it('paginateChat 인자 테스트', async () => {
        let dto = {
            order__createdAt: 'ASC' as 'ASC' | 'DESC',
            take: 30,
        };

        let req = { user: { id: 1 } };

        await controller.paginateChat(dto, req);
        expect(chatService.paginateChat).toHaveBeenCalledWith(dto, req.user.id);
    });

    it('paginateChat 반환값 테스트', async () => {
        let dto = {
            order__createdAt: 'ASC' as 'ASC' | 'DESC',
            take: 30,
        };
        const expectedPaginatedChats = {
            data: [],
            cursor: {
                after: 30,
            },
            count: 0,
            next: 'http://localhost:3001/api/chats?take=30&where__id__more_than=30',
        };
        let req = { user: { id: 1 } };
        jest.spyOn(chatService, 'paginateChat').mockResolvedValue(expectedPaginatedChats);
        const result = await controller.paginateChat(dto, req);
        expect(result).toEqual(expectedPaginatedChats);
    });
});
