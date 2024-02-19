import { Test, TestingModule } from '@nestjs/testing';
import { ChatsGateway } from './chats.gateway';
import { ConfigService } from '@nestjs/config';
import { Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import { ChatsService } from './chats.service';
import { ChatMessagesService } from 'src/messages/messages.service';
import { UserService } from 'src/user/user.service';
import { WsException } from '@nestjs/websockets';
import { SocketBearerTokenGuard } from './guard/ws-bearer-token.guard';
import { EnterChatDto } from './dto/enter-chat.dto';

jest.mock('jsonwebtoken', () => ({
    verify: jest.fn(),
}));

describe('ChatsGateway', () => {
    let gateway: ChatsGateway;
    let mockSocket: any;
    let configService: ConfigService;
    let service: ChatsService;
    let messagesService: ChatMessagesService;
    let userService: UserService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ChatsGateway,
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn().mockReturnValue('TEST_SECRET'),
                    },
                },
                {
                    provide: ChatsService,
                    useValue: {
                        createChat: jest.fn(),
                        checkIdChatExists: jest.fn(),
                    },
                },
                {
                    provide: ChatMessagesService,
                    useValue: {
                        createMessage: jest.fn(),
                    },
                },
                {
                    provide: UserService,
                    useValue: {
                        findById: jest.fn(),
                    },
                },
            ],
        })
            .overrideGuard(SocketBearerTokenGuard)
            .useValue({
                canActivate: jest.fn().mockReturnValue(true),
            })
            .compile();

        gateway = module.get<ChatsGateway>(ChatsGateway);
        configService = module.get<ConfigService>(ConfigService);
        service = module.get<ChatsService>(ChatsService);
        messagesService = module.get<ChatMessagesService>(ChatMessagesService);

        mockSocket = {
            id: '1',
            handshake: {
                query: {},
            },
            join: jest.fn(),
            disconnect: jest.fn(),
            nsp: { name: '/chats/123' },
        };
    });

    it('handleConnection_토큰이_없으면_연결을_끊는다', async () => {
        // 토큰을 먼저 null로 설정합니다.
        mockSocket.handshake.query.token = null;
        // 동기 코드에 대해서는 await를 사용하지 않고 toThrow를 사용해야 합니다.
        expect(() => gateway.handleConnection(mockSocket)).toThrow(WsException);
    });

    it('handleConnection_토큰이_있지만 jwtSecret 타입이 string이 아닌 경우', async () => {
        // 토큰을 먼저 설정합니다.
        mockSocket.handshake.query = { token: 'valid_token' };

        configService.get = jest.fn().mockReturnValue(123);

        gateway.handleConnection(mockSocket);
        expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('성공', async () => {
        // 토큰을 먼저 설정합니다.
        mockSocket.handshake.query = { token: 'valid_token' };
        configService.get = jest.fn().mockReturnValue('TEST_SECRET');
        (jwt.verify as jest.Mock).mockReturnValue({ id: 'user_id' });
        const dto = new EnterChatDto();
        dto.teamId = 1;
        jest.spyOn(gateway, 'enterRoom').mockImplementation((dto, mockSocket) => {
            return Promise.resolve();
        });
        jest.spyOn(mockSocket, 'join').mockImplementation(() => {
            return Promise.resolve();
        });

        gateway.handleConnection(mockSocket);
        expect(mockSocket.disconnect).not.toHaveBeenCalled();
        expect(mockSocket.join).toHaveBeenCalledWith('1');
    });

    // it('should allow connection with valid token', () => {
    //     mockSocket.handshake.query.token = 'valid_token';
    //     (jwt.verify as jest.Mock).mockReturnValue({ id: 'user_id' });

    //     gateway.handleConnection(mockSocket);
    //     expect(mockSocket.disconnect).not.toHaveBeenCalled();
    //     expect(mockSocket.join).toHaveBeenCalledWith('123');
    // });

    // it('should disconnect on invalid token', () => {
    //     mockSocket.handshake.query.token = 'invalid_token';
    //     (jwt.verify as jest.Mock).mockImplementation(() => {
    //         throw new Error('Invalid token');
    //     });

    //     gateway.handleConnection(mockSocket);
    //     expect(mockSocket.disconnect).toHaveBeenCalled();
    // });
});
