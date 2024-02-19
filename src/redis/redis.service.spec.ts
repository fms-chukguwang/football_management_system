import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';
import { ConfigService } from '@nestjs/config';
import IORedis from 'ioredis';

jest.mock('ioredis', () => ({
    // jest.mock 내부에서 MockIORedis 클래스를 직접 정의하고 인스턴스화하여 반환
    __esModule: true, // ES 모듈로 인식하도록 설정
    default: jest.fn().mockImplementation(() => ({
      on: jest.fn(),
      set: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
      expire: jest.fn(),
    })),
  }));
describe('RedisService', () => {
  let service: RedisService;
  let redisClient: IORedis ;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              switch (key) {
                case 'REDIS_HOST':
                  return 'localhost';
                case 'REDIS_PORT':
                  return 6379;
                case 'REDIS_PASSWORD':
                  return 'password';
                default:
                  return null;
              }
            }),
          },
        },
      ],
    }).compile();
    

    service = module.get<RedisService>(RedisService);
    redisClient = service['redisClient'];
  });

  describe('카카오 인증', () => {

    it('kakaoCode should save kakaoCode with userId and set expire time', async () => {
        const userId = 1;
        const kakaoCode = 123456;

        await service.kakaoCode(userId, kakaoCode);

        const key = `kakaoCode:${kakaoCode}`;
        expect(redisClient.set).toHaveBeenCalledWith(key, userId);
        expect(redisClient.expire).toHaveBeenCalledWith(key, service['kakaoCodeTTL']);
    });

  });

  describe('사용자 토큰 인증', () => {

    it('setRefreshToken should save refreshToken with TTL', async () => {
        const userId = 1;
        const refreshToken = 'refreshToken';

        await service.setRefreshToken(userId, refreshToken);

        expect(redisClient.set).toHaveBeenCalledWith(`refreshToken:${userId}`, refreshToken);
        expect(redisClient.expire).toHaveBeenCalledWith(`refreshToken:${userId}`, expect.any(Number));
    });

    it('getRefreshToken should retrieve refreshToken', async () => {
        const userId = 1;
        const refreshToken = 'refreshToken';
        (redisClient.get as jest.Mock).mockResolvedValue(refreshToken);

        const result = await service.getRefreshToken(userId);

        expect(redisClient.get).toHaveBeenCalledWith(`refreshToken:${userId}`);
        expect(result).toBe(refreshToken);
    });

    it('deleteRefreshToken should remove refreshToken', async () => {
        const userId = 1;

        await service.deleteRefreshToken(userId);

        expect(redisClient.del).toHaveBeenCalledWith(`refreshToken:${userId}`);
    });

  });

  describe('사용자 ID 가져오기', () => {

    it('getUserId should retrieve userId by kakaoCode', async () => {
        const kakaoCode = 123456;
        const userId = '1';
        (redisClient.get as jest.Mock).mockResolvedValue(userId);

        const result = await service.getUserId(kakaoCode);

        const key = `kakaoCode:${kakaoCode}`;
        expect(redisClient.get).toHaveBeenCalledWith(key);
        expect(result).toBe(userId);
    });

  });

  describe('팀 메일 인증', () => {

    it('setTeamJoinMailToken should save a random token with expiration time', async () => {
        const randomToken = 'randomTokenString';
    
        await service.setTeamJoinMailToken(randomToken);
    
        expect(redisClient.set).toHaveBeenCalledWith(randomToken, randomToken);
        expect(redisClient.expire).toHaveBeenCalledWith(randomToken, 300);
    });

    it('getTeamJoinMailToken should retrieve a token', async () => {
        const token = 'testToken';
        const expectedValue = 'someValue';
        (redisClient.get as jest.Mock).mockResolvedValue(expectedValue);

        const result = await service.getTeamJoinMailToken(token);

        expect(redisClient.get).toHaveBeenCalledWith(token);
        expect(result).toBe(expectedValue);
    });

    it('deleteTeamJoinMailToken should delete a token', async () => {
        const token = 'testToken';

        await service.deleteTeamJoinMailToken(token);

        expect(redisClient.del).toHaveBeenCalledWith(token);
    });

    it('getTeamDetail should retrieve team details', async () => {
        const teamId = 1;
        const expectedTeamDetail = 'teamDetail';
        (redisClient.get as jest.Mock).mockResolvedValue(expectedTeamDetail);

        const result = await service.getTeamDetail(teamId);

        expect(redisClient.get).toHaveBeenCalledWith(`teamDeatail_${teamId}`);
        expect(result).toBe(expectedTeamDetail);
    });

    it('setTeamDetail should set team details and expire time', async () => {
        const teamId = 1;
        const teamDetail = 'teamDetail';

        await service.setTeamDetail(teamDetail, teamId);

        expect(redisClient.set).toHaveBeenCalledWith(`teamDeatail_${teamId}`, teamDetail);
        expect(redisClient.expire).toHaveBeenCalledWith(`teamDeatail_${teamId}`, 180);
    });

    it('delTeamDetail should delete team details', async () => {
        const teamId = 1;

        await service.delTeamDetail(teamId);

        expect(redisClient.del).toHaveBeenCalledWith(`teamDeatail_${teamId}`);
    });

  });

  describe('PresignedUrl', () => {

    it('getPresignedUrl should retrieve a presigned URL for the given UUID', async () => {
        const uuid = 'testUuid';
        const expectedUrl = 'https://example.com/presigned-url';
        (redisClient.get as jest.Mock).mockResolvedValue(expectedUrl);
    
        const result = await service.getPresignedUrl(uuid);
    
        expect(redisClient.get).toHaveBeenCalledWith(`imageUuid_${uuid}`);
        expect(result).toBe(expectedUrl);
        });
    
        it('setPresignedUrl should save presigned URL with TTL', async () => {
        const uuid = 'testUuid';
        const imageUrl = 'https://example.com/presigned-url';
    
        await service.setPresignedUrl(uuid, imageUrl);
    
        expect(redisClient.set).toHaveBeenCalledWith(`imageUuid_${uuid}`, imageUrl);
        expect(redisClient.expire).toHaveBeenCalledWith(`imageUuid_${uuid}`, 180);
        });
    
  });

  describe('팀 정보 관리', () => {
    const teamId = 1;
    const teamStats = 'team stats';
    const teamTopPlayer = 'top player';
    const teamPlayers = 'team players';
    const yellowAndRedCards = 'cards';

    it('getTeamStats should retrieve team stats', async () => {
      (redisClient.get as jest.Mock).mockResolvedValue(teamStats);
      const result = await service.getTeamStats(teamId);
      expect(redisClient.get).toHaveBeenCalledWith(`teamStats_${teamId}`);
      expect(result).toBe(teamStats);
    });

    it('setTeamStats should save team stats with TTL', async () => {
      await service.setTeamStats(teamStats, teamId);
      expect(redisClient.set).toHaveBeenCalledWith(`teamStats_${teamId}`, teamStats);
      expect(redisClient.expire).toHaveBeenCalledWith(`teamStats_${teamId}`, 3600);
    });

    it('getTeamTopPlayer should retrieve top player', async () => {
      (redisClient.get as jest.Mock).mockResolvedValue(teamTopPlayer);
      const result = await service.getTeamTopPlayer(teamId);
      expect(redisClient.get).toHaveBeenCalledWith(`teamTopPlayer_${teamId}`);
      expect(result).toBe(teamTopPlayer);
    });

    it('setTeamTopPlayer should save top player with TTL', async () => {
      await service.setTeamTopPlayer(teamTopPlayer, teamId);
      expect(redisClient.set).toHaveBeenCalledWith(`teamTopPlayer_${teamId}`, teamTopPlayer);
      expect(redisClient.expire).toHaveBeenCalledWith(`teamTopPlayer_${teamId}`, 3600);
    });

    it('getTeamPlayers should retrieve team players', async () => {
      (redisClient.get as jest.Mock).mockResolvedValue(teamPlayers);
      const result = await service.getTeamPlayers(teamId);
      expect(redisClient.get).toHaveBeenCalledWith(`teamPlayers_${teamId}`);
      expect(result).toBe(teamPlayers);
    });

    it('setTeamPlayers should save team players with TTL', async () => {
      await service.setTeamPlayers(teamPlayers, teamId);
      expect(redisClient.set).toHaveBeenCalledWith(`teamPlayers_${teamId}`, teamPlayers);
      expect(redisClient.expire).toHaveBeenCalledWith(`teamPlayers_${teamId}`, 3600);
    });

    it('getTeamYellowAndRedCards should retrieve cards', async () => {
      (redisClient.get as jest.Mock).mockResolvedValue(yellowAndRedCards);
      const result = await service.getTeamYellowAndRedCards(teamId);
      expect(redisClient.get).toHaveBeenCalledWith(`temaYellowAndRedCards_${teamId}`);
      expect(result).toBe(yellowAndRedCards);
    });

    it('setTeamYellowAndRedCards should save cards with TTL', async () => {
      await service.setTeamYellowAndRedCards(yellowAndRedCards, teamId);
      expect(redisClient.set).toHaveBeenCalledWith(`temaYellowAndRedCards_${teamId}`, yellowAndRedCards);
      expect(redisClient.expire).toHaveBeenCalledWith(`temaYellowAndRedCards_${teamId}`, 3600);
    });

    it('delTeamStats should remove team stats, top player, cards, and players', async () => {
      await service.delTeamStats(teamId);
      expect(redisClient.del).toHaveBeenCalledWith(`teamStats_${teamId}`);
      expect(redisClient.del).toHaveBeenCalledWith(`teamTopPlayer_${teamId}`);
      expect(redisClient.del).toHaveBeenCalledWith(`temaYellowAndRedCards_${teamId}`);
      expect(redisClient.del).toHaveBeenCalledWith(`teamPlayers_${teamId}`);
    });
  });
});
