import { Test, TestingModule } from '@nestjs/testing';
import { ChatsService } from './chats.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Chats } from './entities/chats.entity';
import { Repository } from 'typeorm';
import { CommonService } from 'src/common/common.service';
import { PaginateChatDto } from './dto/paginate-chat.dto';

describe('ChatsService', () => {
    let service: ChatsService;
    let repository: Repository<Chats>;
    let commonService: CommonService;

    // beforeEach() 함수는 각 테스트가 실행되기 전에 실행되는 함수입니다.
    // - beforeEach/afterEach와 동일 레벨 또는 하위 레벨의 테스트가 실행 될 때 마다 반복적으로 실행
    // - 비동기 함수를 사용하는 경우 일반 테스트 함수와 동일하게 처리 (done 파라미터 사용, promise return)
    beforeEach(async () => {
        const mockCommonService = {
            paginate: jest.fn(),
        };
        const mockRepository = {
            find: jest.fn(),
            save: jest.fn(),
            exists: jest.fn(),
            createQueryBuilder: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ChatsService,
                {
                    provide: getRepositoryToken(Chats),
                    useValue: {
                        find: jest.fn(),
                    },
                },
                {
                    provide: CommonService,
                    useValue: mockCommonService,
                },
                {
                    provide: getRepositoryToken(Chats),
                    useValue: mockRepository,
                },
            ],
        }).compile();

        service = module.get<ChatsService>(ChatsService);
        repository = module.get<Repository<Chats>>(getRepositoryToken(Chats));
        commonService = module.get<CommonService>(CommonService);
    });

    it('모든 채팅 리스트 반환(getAllChats() 테스트)', async () => {
        const expectedChats = [];
        // jest.spyOn(object, methodName)
        // 어떤 객체에 속한 함수의 구현을 가짜로 대체하지 않고, 해당 함수의 호출 여부와 어떻게 호출되었는지만을 알아내야 할 때가 있습니다
        jest.spyOn(repository, 'find').mockResolvedValue(expectedChats);
        const chats = await service.getAllChats();
        expect(chats).toEqual(expectedChats);
        expect(repository.find).toHaveBeenCalledWith({
            relations: ['users'],
        });
    });

    it('채팅 페이지네이션(paginateChat)', async () => {
        const userId = 1;
        const paginateChatDto = new PaginateChatDto();
        const expectedPaginatedChats = {
            data: [],
            cursor: {
                after: 30,
            },
            count: 0,
            next: 'http://localhost:3001/api/chats?take=30&where__id__more_than=30',
        };

        jest.spyOn(commonService, 'paginate').mockResolvedValue(expectedPaginatedChats);

        const result = await service.paginateChat(paginateChatDto, userId);
        expect(result).toEqual(expectedPaginatedChats);
        expect(commonService.paginate).toHaveBeenCalledWith(
            paginateChatDto,
            repository,
            {
                relations: ['users'],
                where: {
                    users: {
                        id: userId,
                    },
                },
            },
            'chats',
        );
    });

    // it('채팅방 생성(createChat)', async () => {
    //     const createChatDto = {
    //         userIds: [1],
    //     };
    //     const savedChat = {
    //         id: 1,
    //         users: createChatDto.userIds.map((id) => ({ id })),
    //         messages: [],
    //         team: null,
    //         createdAt: new Date(),
    //         updatedAt: new Date(),
    //         deletedAt: null,
    //     };
    //     jest.spyOn(repository, 'save').mockResolvedValue(savedChat);
    // });

    it('채팅방 초대(inviteChat)', async () => {
        const chatId = 1;
        const userId = 1;
        const expected = {
            chatId,
            userId,
        };
        const queryBuilder = {
            relation: jest.fn().mockReturnThis(),
            of: jest.fn().mockReturnThis(),
            add: jest.fn().mockResolvedValue(expected),
        };

        jest.spyOn(repository, 'createQueryBuilder').mockReturnValue(queryBuilder as any);

        const result = await service.inviteChat(chatId, userId);

        expect(result).toEqual(expected);
        expect(queryBuilder.relation).toHaveBeenCalledWith('users');
        expect(queryBuilder.of).toHaveBeenCalledWith(chatId);
        expect(queryBuilder.add).toHaveBeenCalledWith(userId);
    });

    it('채팅방 존재 여부 확인(checkIdChatExists)', async () => {
        const chatId = 10;
        const expected = true;
        jest.spyOn(repository, 'exists').mockResolvedValue(expected); // 즉, 구현하고자 하는 함수의 반환값을 설정해준다.

        const result = await service.checkIdChatExists(chatId); // 구현하고자 하는 함수를 호출한다.
        expect(result).toEqual(expected);
        expect(repository.exists).toHaveBeenCalledWith({
            where: {
                id: chatId,
            },
        });
    });

    it('채팅방 멤버 확인(checkMember)', async () => {
        const chatId = 1;
        const userId = 1;
        const expcted = 1;
        const queryBuilder = {
            leftJoin: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getCount: jest.fn().mockResolvedValue(expcted),
        };
        jest.spyOn(repository, 'createQueryBuilder').mockReturnValue(queryBuilder as any);

        const result = await service.checkMember(chatId, userId);
        expect(result).toEqual(expcted);
        expect(queryBuilder.leftJoin).toHaveBeenCalledWith('chat.users', 'users');
        expect(queryBuilder.where).toHaveBeenCalledWith('chat.id = :chatId', { chatId });
        expect(queryBuilder.andWhere).toHaveBeenCalledWith('users.id = :userId', { userId });
        expect(queryBuilder.getCount).toHaveBeenCalled();
    });

    it('채팅방 나가기(leaveChat)', async () => {
        const chatId = 1;
        const socketId = 1;
        const expected = {
            chatId,
            socketId,
        };
        const queryBuilder = {
            relation: jest.fn().mockReturnThis(),
            of: jest.fn().mockReturnThis(),
            remove: jest.fn().mockResolvedValue(expected),
        };
        jest.spyOn(repository, 'createQueryBuilder').mockReturnValue(queryBuilder as any);

        const result = await service.leaveChat(chatId, socketId);
        expect(result).toEqual(expected);
        expect(queryBuilder.relation).toHaveBeenCalledWith('users');
        expect(queryBuilder.of).toHaveBeenCalledWith(chatId);
        expect(queryBuilder.remove).toHaveBeenCalledWith(socketId);
    });
});
