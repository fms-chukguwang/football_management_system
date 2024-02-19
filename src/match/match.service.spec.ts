import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MatchService } from './match.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository,SelectQueryBuilder } from 'typeorm';

import { Match } from './entities/match.entity';
import { User } from '../user/entities/user.entity';
import { Member } from '../member/entities/member.entity';
import { TeamModel } from '../team/entities/team.entity';
import { MatchResult } from './entities/match-result.entity';
import { PlayerStats } from './entities/player-stats.entity';
import { TeamStats } from './entities/team-stats.entity';
import { SoccerField } from './entities/soccer-field.entity';

import { EmailService } from '../email/email.service';
import { AuthService } from '../auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AwsService } from '../aws/aws.service';
import { RedisService } from '../redis/redis.service';
import { DataSource, Not } from 'typeorm';

import { substitionsDto, createMatchResultDto } from './dtos/result-match.dto';
import { createPlayerStatsDto } from './dtos/player-stats.dto';
import { ResultMembersDto } from './dtos/result-final.dto';

jest.mock('../email/email.service');
jest.mock('../auth/auth.service');
jest.mock('@nestjs/jwt');
jest.mock('@nestjs/config');
jest.mock('../aws/aws.service');



describe('MatchService', () => {
    let service: MatchService;
    let emailService: EmailService;
    let awsService: AwsService;
    let authService: AuthService;
    let jwtService: JwtService;
    let redisService: RedisService;
    let userRepository: Repository<User>;
    let teamRepository: Repository<TeamModel>;
    let matchRepository = {
        findOne: jest.fn(),
        update: jest.fn().mockResolvedValue({ affected: 1 }), 
    } as unknown as Repository<Match>;
    let dataSource: DataSource;

    const mockRedisService = {
        connect: jest.fn().mockResolvedValue(true),
        disconnect: jest.fn().mockResolvedValue(true),
        delTeamStats: jest.fn(),
    };

    const mockMatchRepository = {
        findOne: jest.fn(),
        find: jest.fn(),
        create: jest.fn().mockImplementation((matchData) => matchData),
        save: jest.fn().mockResolvedValue({
            id: 1,
        }),
        update: jest.fn().mockResolvedValue({ affected: 1 }),
        createQueryBuilder: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockImplementation(() => Promise.resolve(undefined)), 
        }),
    };
    const mockUserRepository = {
        findOne: jest.fn().mockResolvedValue({
            id: 1,
            name: 'Test User',
            // 필요한 추가 속성
        }),
    };
    const mockMemberRepository = {
        findOne:jest.fn(),
        find:jest.fn(),
        createQueryBuilder: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockResolvedValueOnce({ /* 첫 번째 호출에 대한 모의 반환 값 */ }),
            getMany: jest.fn().mockResolvedValueOnce([/* 여러 호출에 대한 모의 반환 값 */]),
        }),
    };
    const mockTeamModelRepository = {
        find: jest.fn(),
        createQueryBuilder: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            getMany: jest.fn().mockResolvedValue([
                { id: 1, name: 'Test Team 1', creator_id: 1 },
                { id: 2, name: 'Test Team 2', creator_id: 1 }
            ]),
        }),
        findOne: jest.fn().mockResolvedValue({
            id: 2,
            name: '상대 팀',
            creator: {
                email: 'away@example.com'
            },
        })
    };
    const mockMatchResultRepository = {
        findOne: jest.fn().mockResolvedValue({
            id: 1,
            match_id: 2,
            team_id: 1,
        }),
        find:jest.fn(),
        create: jest.fn(),
        save:jest.fn(),
        count:jest.fn()
    };
    const mockPlayerStatsRepository = {
        find:jest.fn(),
        create: jest.fn(),
        save:jest.fn()
    };
    const mockTeamStatsRepository = {
        create:jest.fn().mockResolvedValue({
            id: 1,
        }),
        save:jest.fn(),
        update:jest.fn(),
        findOne:jest.fn()
    };
    const mockSoccerFieldRepository = {
        find:jest.fn(),
        findOne:jest.fn(),
    };

    const mockDataSource = { 
        createQueryRunner: jest.fn(),
        query: jest.fn(),
        connect: jest.fn().mockResolvedValue(undefined),
        startTransaction: jest.fn().mockResolvedValue(undefined),
        manager: {
          save: jest.fn().mockResolvedValue(undefined),
          update: jest.fn().mockResolvedValue(undefined), 
        },
        commitTransaction: jest.fn().mockResolvedValue(undefined),
        rollbackTransaction: jest.fn().mockResolvedValue(undefined),
        release: jest.fn().mockResolvedValue(undefined),
    };

    beforeEach(async () => {

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MatchService,
                EmailService,
                AuthService,
                JwtService,
                ConfigService,
                AwsService,
                { provide: RedisService, useValue: mockRedisService },
                { provide: getRepositoryToken(Match), useValue: mockMatchRepository },
                { provide: getRepositoryToken(User), useValue: mockUserRepository },
                { provide: getRepositoryToken(Member), useValue: mockMemberRepository },
                { provide: getRepositoryToken(TeamModel), useValue: mockTeamModelRepository },
                { provide: getRepositoryToken(MatchResult), useValue: mockMatchResultRepository },
                { provide: getRepositoryToken(PlayerStats), useValue: mockPlayerStatsRepository },
                { provide: getRepositoryToken(TeamStats), useValue: mockTeamStatsRepository },
                { provide: getRepositoryToken(SoccerField), useValue: mockSoccerFieldRepository },
                { provide: DataSource, useValue: mockDataSource},
            ],
        }).compile();

        service = module.get<MatchService>(MatchService);
        emailService = module.get<EmailService>(EmailService);
        awsService = module.get<AwsService>(AwsService);
        authService = module.get<AuthService>(AuthService);
        jwtService = module.get<JwtService>(JwtService); 
        userRepository = module.get<Repository<User>>(getRepositoryToken(User)); 
        teamRepository = module.get<Repository<TeamModel>>(getRepositoryToken(TeamModel)); 
        matchRepository = module.get<Repository<Match>>(getRepositoryToken(Match));

        // 모의 메서드 구현
        (emailService.reqMatchEmail as jest.Mock).mockResolvedValue(true);
        (authService.generateAccessEmailToken as jest.Mock).mockReturnValue('some-token');
        (awsService.presignedUrl as jest.Mock).mockResolvedValue('imageUuid_some');
        redisService = module.get<RedisService>(RedisService);
        // Redis 연결 초기화
        await mockRedisService.connect();

        jest.clearAllMocks(); 

    });

    afterEach(async () => {
        await mockRedisService.disconnect();
    });

    describe('requestCreMatch - 경기 생성 이메일 요청(상대팀 구단주에게)', () => {

        let createRequestDto;

        beforeEach(async () => {

            jest.spyOn(service, 'verifyReservedMatch').mockResolvedValue(undefined);
            jest.spyOn(service, 'verifyTeamCreator').mockResolvedValue([
                { name: '구단주 이름' } as any
            ] );
    
            jest.spyOn(teamRepository, 'findOne').mockResolvedValue({
                id: 1, 
                name: 'Team Name', 
                creator: {
                  name: 'Away Team',
                  email: 'away@example.com'
                },
            }as any);
    
            createRequestDto = {
                date: '2024-02-25',
                time: '18:00:00',
                homeTeamId: 1,
                awayTeamId: 2,
                fieldId: 173,
            };

        });

        it('성공적으로 요청을 처리해야 한다', async () => {
            const userId = 1;
            const result = await service.requestCreMatch(userId, createRequestDto);
            expect(result).toBeTruthy();
        });
    
        it('올바른 매개변수로 emailService.reqMatchEmail을 호출해야 한다', async () => {
            const userId = 1;
            await service.requestCreMatch(userId, createRequestDto);
            expect(emailService.reqMatchEmail).toHaveBeenCalledWith(expect.any(Object));
        });
    
        it('emailService.reqMatchEmail을 정확히 한 번 호출해야 한다', async () => {
            const userId = 1;
            await service.requestCreMatch(userId, createRequestDto);
            expect(emailService.reqMatchEmail).toHaveBeenCalledTimes(1);
        });
    
        it('사용자를 위한 접근 이메일 토큰을 생성해야 한다', async () => {
            const userId = 1;
            await service.requestCreMatch(userId, createRequestDto);
            expect(authService.generateAccessEmailToken).toHaveBeenCalledWith(userId);
        });
    
        it('경기 시간이 이미 예약되어 있다면 예외를 던져야 한다', async () => {
            jest.spyOn(service, 'verifyReservedMatch').mockRejectedValue(new BadRequestException('이미 예약된 경기 일정 입니다.'));
            const userId = 1;
            await expect(service.requestCreMatch(userId, createRequestDto)).rejects.toThrow(BadRequestException);
        });

    });

    describe('findOneMatch - 경기 일정 조회', () => {

        it('주어진 id에 대한 경기를 반환해야 한다', async () => {
            const mockMatch = {
                id: 1,
                date: '2024-02-25',
                time: '18:00:00',
            };
        
            mockMatchRepository.findOne.mockResolvedValue(mockMatch);
        
            const matchId = 1;
            const result = await service.findOneMatch(matchId);
        
            expect(result).toBeDefined();
            expect(result).toEqual(mockMatch);
            expect(mockMatchRepository.findOne).toHaveBeenCalledWith({
                where: { id: matchId },
            });
        });

        it('주어진 id에 대한 경기가 없으면 NotFoundException을 던져야 한다', async () => {
            mockMatchRepository.findOne.mockResolvedValue(null);
        
            const matchId = 999; 
        
            await expect(service.findOneMatch(matchId)).rejects.toThrow(NotFoundException);
        });            

    });

    describe('createMatch - 이메일 수락 후 경기 생성', () => {
        let createMatchDto;
    
        beforeEach(() => {
            createMatchDto = {
                token: 'valid-token',
                date: '2024-02-25',
                time: '15:00:00',
                homeTeamId: '1',
                awayTeamId: '2',
                fieldId: '1',
            };

            jest.spyOn(teamRepository, 'createQueryBuilder').mockReturnValue({
                select: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue([
                  {
                    id: 1,
                    creator_id: 1,
                    name: 'Test Team',
                    imageUUID: 'uuid',
                    location_id: 1,
                  },
                ]),
            } as any); 

            jest.spyOn(matchRepository, 'save').mockImplementation(match => Promise.resolve({ 
                id: 1, 
                ...match 
            } as Match));

            jest.spyOn(matchRepository, 'create').mockImplementation(match => match as Match) ;
        });
    
        it('JWT 인증 성공 시 경기 생성', async () => {
            jest.spyOn(jwtService, 'verify').mockImplementation(async (token: string) => {
                return { id: 1 };
            });

            const result = await service.createMatch(createMatchDto);
    
            expect(jwtService.verify).toHaveBeenCalledWith(createMatchDto.token, expect.any(Object));
            expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
            expect(matchRepository.create).toHaveBeenCalledWith(expect.any(Object));
            expect(matchRepository.save).toHaveBeenCalled();
            expect(result).toEqual(expect.objectContaining({
                date: createMatchDto.date,
                time: createMatchDto.time,
                owner_id: 1,
                home_team_id: parseInt(createMatchDto.homeTeamId),
                away_team_id: parseInt(createMatchDto.awayTeamId),
                soccer_field_id: parseInt(createMatchDto.fieldId),
            }));
        });
    
        it('JWT 인증 실패 시 UnauthorizedException 발생', async () => {
            jest.spyOn(jwtService, 'verify').mockImplementation(() => Promise.reject(new UnauthorizedException()));
    
            await expect(service.createMatch(createMatchDto)).rejects.toThrow(UnauthorizedException);
        });

        it('match 객체 생성에 실패하면 NotFoundException을 던져야 한다', async () => {
            const userId = 1;
            const createRequestDto = {
              date: '2024-02-25',
              time: '18:00:00',
              homeTeamId: 1,
              awayTeamId: 2,
              fieldId: 173,
            };

            jest.spyOn(jwtService, 'verify').mockImplementation(async (token: string) => {
                return { id: 1 };
            });
        
            jest.spyOn(matchRepository, 'create').mockReturnValue(null); 
        
            await expect(service.createMatch(createMatchDto)).rejects.toThrow(NotFoundException);
        });

        it('사용자 정보가 유효하지 않으면 UnauthorizedException을 던져야 한다', async () => {
            jest.spyOn(jwtService, 'verify').mockImplementation(async (token: string) => {
              throw new UnauthorizedException('사용자 정보가 유효하지 않습니다.');
            });
        
            await expect(service.createMatch(createMatchDto)).rejects.toThrow(UnauthorizedException);
        });
    
    });

    describe('findIfMatchOver - 경기가 끝났는지 조회', () => {


        it('경기 정보가 없을 경우 NotFoundException을 던진다', async () => {
            jest.spyOn(matchRepository, 'findOne').mockResolvedValue(undefined);
        
            await expect(service.findIfMatchOver(1)).rejects.toThrow(NotFoundException);
          });
        
          it('경기가 아직 끝나지 않았을 경우 NotFoundException을 던진다', async () => {
            const matchDate = new Date();
            matchDate.setHours(matchDate.getHours() + 1); 
        
            jest.spyOn(matchRepository, 'findOne').mockResolvedValue({
                id: 1,
                owner_id: 1,
                date: '2024-02-25',
                time: '15:00:00',
              } as Match);
        
            await expect(service.findIfMatchOver(1)).rejects.toThrow(NotFoundException);
          });
        
          it('경기가 끝났을 경우 true를 반환한다', async () => {
            const matchDate = new Date();
            matchDate.setHours(matchDate.getHours() - 3); 
        
            jest.spyOn(matchRepository, 'findOne').mockResolvedValue({
              id: 1,
              date: matchDate.toISOString().split('T')[0],
              time: matchDate.toTimeString().split(' ')[0],
            }as Match);
        
            await expect(service.findIfMatchOver(1)).resolves.toBe(true);
          });

    });

    describe('requestUptMatch - 경기 수정 이메일 요청(상대팀 구단주에게)', () => {

        let updateRequestDto;

        beforeEach(async () => {

            updateRequestDto = {
                date: '2024-02-25',
                time: '18:00:00',
                reason: '기상악화',
            };

            jest.spyOn(authService, 'generateAccessEmailToken').mockReturnValue('fake-token');
            jest.spyOn(service, 'verifyTeamCreator').mockResolvedValue([
                { name: '구단주 이름' } as any
            ] );
    
            jest.spyOn(teamRepository, 'findOne').mockResolvedValue({
                id: 1, 
                name: 'Team Name',
                creator: {
                  name: 'Away Team',
                  email: 'away@example.com'
                },
            }as any);
            jest.spyOn(service, 'verifyReservedMatch').mockResolvedValue(undefined);
            jest.spyOn(service, 'verifyOneMatch').mockResolvedValue({ id: 1, home_team_id: 1, away_team_id: 2, date: '2024-01-29', time: '14:00:00' } as any);
            jest.spyOn(emailService, 'reqMatchEmail').mockResolvedValue(true as any);
          });
        
          it('성공적으로 경기 수정 이메일 요청을 보내야 한다', async () => {
            const userId = 1;
            const matchId = 1;
        
            const result = await service.requestUptMatch(userId, matchId, updateRequestDto);
        
            expect(result).toBe(true);
            expect(authService.generateAccessEmailToken).toHaveBeenCalledWith(userId);
            expect(emailService.reqMatchEmail).toHaveBeenCalledWith(expect.any(Object));
          });

    });

    describe('updateMatch - 이메일 수락 후 경기 수정', () => {
        let updatematchDto;

        beforeEach(async () => {

            updatematchDto = {
                token: 'valid-token',
                date: '2024-02-25',
                time: '18:00:00',
                reason: '기상악화',
            };
    
            jest.spyOn(service, 'verifyTeamCreator').mockResolvedValue([
                { name: '구단주 이름' } as any
            ] );

            jest.spyOn(service, 'findOneMatch').mockResolvedValue({ id: 1, date: '2024-01-01', time: '15:00' } as Match);
    
            jest.spyOn(service, 'verifyReservedMatch').mockResolvedValue(undefined);

            jest.spyOn(mockMatchRepository, 'update').mockImplementation(() => {
                return Promise.resolve({
                  affected: 1,
                  raw: [], 
                  generatedMaps: [] 
                });
            });
        });
    
        it('경기 정보를 성공적으로 업데이트해야 한다', async () => {

            jest.spyOn(jwtService, 'verify').mockImplementation(async (token: string) => {
                return { id: 1 }; 
            });

            const matchId = 1;
    
            const result = await service.updateMatch(matchId, updatematchDto);
    
            expect(result).toBeDefined();
            expect(jwtService.verify).toHaveBeenCalledWith(updatematchDto.token, expect.any(Object));
            expect(mockMatchRepository.update).toHaveBeenCalledWith({ id: matchId }, { date: updatematchDto.date, time: updatematchDto.time });
        });

        it('사용자 정보가 유효하지 않으면 UnauthorizedException을 던져야 한다', async () => {
            jest.spyOn(jwtService, 'verify').mockImplementation(async (token: string) => {
              throw new UnauthorizedException('사용자 정보가 유효하지 않습니다.');
            });
        
            const matchId = 1;
        
            await expect(service.updateMatch(matchId, updatematchDto)).rejects.toThrow(UnauthorizedException);
          });

    });

    describe('requestDelMatch - 경기 삭제 이메일 요청(상대팀 구단주에게)', () => {

        let deleterequestDto;

        beforeEach(() => {
            deleterequestDto = {
                reason: '날씨 악화로 인한 취소'
            };
    
            jest.spyOn(authService, 'generateAccessEmailToken').mockReturnValue('fake-token');
    
            jest.spyOn(service, 'verifyTeamCreator').mockResolvedValue([
                { name: '구단주 이름', id:1 } as any
            ] );

            jest.spyOn(service, 'verifyOneMatch').mockResolvedValue({
                id: 1,
                date: '2024-02-25',
                time: '15:00:00',
                home_team_id: 1,
                away_team_id: 2
            }as any);

            jest.spyOn(emailService, 'reqMatchEmail').mockResolvedValue(true as any);
        });
    
        it('성공적으로 경기 삭제 이메일 요청을 보내야 한다', async () => {
            const userId = 1;
            const matchId = 2;
    
            const result = await service.requestDelMatch(userId, matchId, deleterequestDto);
    
            expect(result).toBe(true);
            expect(authService.generateAccessEmailToken).toHaveBeenCalledWith(userId);
            expect(service.verifyTeamCreator).toHaveBeenCalledWith(userId);
            expect(service.verifyOneMatch).toHaveBeenCalledWith(matchId,1);
            expect(emailService.reqMatchEmail).toHaveBeenCalledWith(expect.objectContaining({
                email: 'away@example.com',
                subject: '경기 일정 삭제 요청',
                clubName: 'Team Name',
                originalSchedule: '2024-02-25 15:00:00',
                newSchedule: '',
                reason: deleterequestDto.reason,
                homeTeamId: 0,
                awayTeamId: 0,
                fieldId: 0,
                senderName: '구단주 이름 구단주',
                url: expect.stringContaining('http://localhost/api/match/2/delete'),
                chk: 'delete',
                token: 'fake-token',
            }));
        });

    });

    describe('deleteMatch - 이메일 수락 후 경기 삭제', () => {
        let deleteMatchDto;
        let matchId;
    
        beforeEach(() => {
            deleteMatchDto = {
                token: 'valid-token',
            };
            matchId = 1;
    
            jest.spyOn(jwtService, 'verify').mockImplementation(async (token: string) => {
                return { id: 1 };
            });
    
            jest.spyOn(userRepository, 'findOne').mockResolvedValue({ id: 1, name: 'Test User' } as User);
    
            jest.spyOn(service, 'verifyTeamCreator').mockResolvedValue([
                { name: '구단주 이름',id: 1 } as any
            ] );
    
            jest.spyOn(service, 'verifyOneMatch').mockResolvedValue({
                id: 1,
                date: '2024-02-25',
                time: '15:00:00',
                home_team_id: 1,
                away_team_id: 2
            }as any);
    
            mockDataSource.createQueryRunner = jest.fn().mockReturnValue({
                connect: jest.fn().mockResolvedValue(null),
                startTransaction: jest.fn().mockResolvedValue(null),
                manager: {
                    delete: jest.fn().mockResolvedValue({ affected: 1 }),
                },
                commitTransaction: jest.fn().mockResolvedValue(null),
                rollbackTransaction: jest.fn().mockResolvedValue(null),
                release: jest.fn().mockResolvedValue(null),
            });
        });
    
        it('경기 삭제를 성공적으로 처리해야 한다', async () => {
            await expect(service.deleteMatch(deleteMatchDto, matchId)).resolves.toBeUndefined();
    
            expect(jwtService.verify).toHaveBeenCalledWith(deleteMatchDto.token, expect.any(Object));
            expect(service.verifyTeamCreator).toHaveBeenCalledWith(1);
            expect(service.verifyOneMatch).toHaveBeenCalledWith(matchId, 1);
            expect(mockDataSource.createQueryRunner().manager.delete).toHaveBeenCalledWith('match_results', { match_id: matchId });
            expect(mockDataSource.createQueryRunner().manager.delete).toHaveBeenCalledWith('matches', { id: matchId });
        });

        it('사용자 정보가 유효하지 않으면 UnauthorizedException을 던져야 한다', async () => {
            jest.spyOn(jwtService, 'verify').mockImplementation(async (token: string) => {
              throw new UnauthorizedException('사용자 정보가 유효하지 않습니다.');
            });
        
            const matchId = 1;
        
            await expect(service.deleteMatch(deleteMatchDto, matchId)).rejects.toThrow(UnauthorizedException);
        });

        it('경기 삭제 중 예외가 발생하면 InternalServerErrorException을 던져야 한다', async () => {
            const queryRunner = mockDataSource.createQueryRunner();
            jest.spyOn(queryRunner.manager, 'delete').mockImplementation(() => {
            throw new Error('Database Error');
            });
        
            await expect(service.deleteMatch(deleteMatchDto, matchId)).rejects.toThrow(InternalServerErrorException);
        
            expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
        });
    });

    describe('getTeamMatchResult - 경기 결과 (팀) 정보 가져오기', () => {

        it('해당하는 팀의 경기 결과가 있으면 반환해야 한다', async () => {
        const mockMatchResult = {
            id: 1,
            match_id: 2,
            team_id: 1,
            match: { /* 경기 정보 */ },
        };
        mockMatchResultRepository.findOne.mockResolvedValue(mockMatchResult);

        const result = await service.getTeamMatchResult(1, 1);

        expect(result).toEqual(mockMatchResult);
        expect(mockMatchResultRepository.findOne).toHaveBeenCalledWith({
            where: {
            match_id: 1,
            team_id: 1,
            },
            relations: {
            match: true,
            },
        });
        });

        it('해당하는 팀의 경기 결과가 없으면 BadRequestException을 발생시켜야 한다', async () => {
            mockMatchResultRepository.findOne.mockResolvedValue(null);

        await expect(service.getTeamMatchResult(1, 1)).rejects.toThrow(BadRequestException);
        });
    });

    describe('resultMatchCreate - 경기 결과 등록', () => {

        const mockSubstitionsDto: substitionsDto[] = [
            {
                inPlayerId: 2, 
                outPlayerId: 1, 
            },
        ];

        const mockCreateMatchResultDto: createMatchResultDto = {
            cornerKick: 5, 
            substitions: mockSubstitionsDto, 
            passes: 150,
            penaltyKick: 0, 
            freeKick: 6,
        };

        it('경기 결과 등록 성공 시나리오', async () => {
            const userId = 1;
            const matchId = 1;
      
            jest.spyOn(service, 'findIfMatchOver').mockResolvedValue(true);
            jest.spyOn(service, 'verifyTeamCreator').mockResolvedValue([{ id: userId } as any]);
            jest.spyOn(service, 'verifyOneMatch').mockResolvedValue({ id: matchId } as Match);
            jest.spyOn(service, 'isMatchDetail').mockResolvedValue(null);
            jest.spyOn(service, 'chkResultMember').mockResolvedValue(true as any);
            const matchResult = mockMatchResultRepository.create.mockReturnValue({
                match_id: matchId,
                team_id: 1,
                cornerKick: 5, 
                substitions: mockSubstitionsDto, 
                passes: 150, 
                penaltyKick: 0,
                freeKick: 6,
                clean_sheet: false
            });
            mockMatchResultRepository.save.mockResolvedValue(matchResult);
            const queryRunnerMock = {
              connect: jest.fn().mockResolvedValue(undefined),
              startTransaction: jest.fn().mockResolvedValue(undefined),
              manager: {
                save: jest.fn().mockResolvedValue(undefined),
              },
              commitTransaction: jest.fn().mockResolvedValue(undefined),
              rollbackTransaction: jest.fn().mockResolvedValue(undefined),
              release: jest.fn().mockResolvedValue(undefined),
            };
            mockDataSource.createQueryRunner.mockReturnValue(queryRunnerMock);
      
            await expect(service.resultMatchCreate(userId, matchId, mockCreateMatchResultDto)).resolves.not.toThrow();
      
            expect(service.findIfMatchOver).toHaveBeenCalledWith(matchId);
            expect(service.verifyTeamCreator).toHaveBeenCalledWith(userId);
            expect(service.verifyOneMatch).toHaveBeenCalledWith(matchId, userId);
            expect(service.isMatchDetail).toHaveBeenCalledWith(matchId, userId);
            expect(service.chkResultMember).toHaveBeenCalledWith(userId, matchId, mockCreateMatchResultDto);
            expect(queryRunnerMock.manager.save).toHaveBeenCalled();
            expect(queryRunnerMock.commitTransaction).toHaveBeenCalled();
         });
      
         it('경기 결과가 이미 등록된 경우 NotFoundException 발생', async () => {
            const userId = 1;
            const matchId = 1;
      
            jest.spyOn(service, 'isMatchDetail').mockResolvedValue({ id:2  } as MatchResult);
      
            await expect(service.resultMatchCreate(userId, matchId, mockCreateMatchResultDto)).rejects.toThrow(NotFoundException);
        });

        it('경기 결과 조회 시 예외가 발생하면 NotFoundException을 던져야 한다', async () => {
            const userId = 1;
            const matchId = 1;
            jest.spyOn(service, 'isMatchDetail').mockRejectedValue(new NotFoundException('경기결과 기록을 생성할 수 없습니다.'));
            
            await expect(service.resultMatchCreate(userId, matchId, mockCreateMatchResultDto)).rejects.toThrow(NotFoundException);
        });
    
        it('트랜잭션 중 오류가 발생하면 NotFoundException 던지고 롤백 한다', async () => {
            const userId = 1;
            const matchId = 1;
            
            const queryRunnerMock = {
                connect: jest.fn().mockResolvedValue(undefined),
                startTransaction: jest.fn().mockResolvedValue(undefined),
                manager: {
                  save: jest.fn().mockResolvedValue(undefined),
                },
                commitTransaction: jest.fn().mockResolvedValue(undefined),
                rollbackTransaction: jest.fn().mockResolvedValue(undefined),
                release: jest.fn().mockResolvedValue(undefined),
            };
            jest.spyOn(queryRunnerMock.manager, 'save').mockImplementation(() => {
                throw new InternalServerErrorException('서버 에러가 발생했습니다.');
            });
            
            await expect(service.resultMatchCreate(userId, matchId, mockCreateMatchResultDto)).rejects.toThrow(NotFoundException);
      });

        
      it('트랜잭션 중 오류가 발생하면 롤백이 수행되어야 한다', async () => {

        const userId = 1;
        const matchId = 1;
  
        // 모의 구현
        jest.spyOn(service, 'findIfMatchOver').mockResolvedValue(true);
        jest.spyOn(service, 'verifyTeamCreator').mockResolvedValue([{ id: userId } as any]);
        jest.spyOn(service, 'verifyOneMatch').mockResolvedValue({ id: matchId } as Match);
        jest.spyOn(service, 'isMatchDetail').mockResolvedValue(null);
        jest.spyOn(service, 'chkResultMember').mockResolvedValue(true as any);

        mockDataSource.createQueryRunner().manager.save.mockImplementation(() => {
          throw new Error('DB Error');
        });

        await expect(service.resultMatchCreate(userId, matchId, mockCreateMatchResultDto))
            .rejects
            .toThrow(InternalServerErrorException); 

        const queryRunner = mockDataSource.createQueryRunner();
        expect(queryRunner.startTransaction).toHaveBeenCalled();
        expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
        expect(queryRunner.release).toHaveBeenCalled();
    });
      
    });

    describe('getMembersMatchResult - 경기 결과 (팀내 선수 전체) 정보 가져오기', () => {

        it('팀내 선수 전체의 경기 결과 정보가 있으면 반환해야 한다', async () => {
            const mockMemberStats = [
              { id:1, team_id:1, match_id:2, member_id:1,clean_sheet:0, assists:1, goals:0 },
              { id:2, team_id:1, match_id:2, member_id:3,clean_sheet:0, assists:1, goals:0 },
            ];
            mockPlayerStatsRepository.find.mockResolvedValue(mockMemberStats);
      
            const matchId = 1;
            const teamId = 1;
            const result = await service.getMembersMatchResult(matchId, teamId);
      
            expect(result).toEqual(mockMemberStats);
            expect(mockPlayerStatsRepository.find).toHaveBeenCalledWith({
              where: {
                match_id: matchId,
                team_id: teamId,
              },
            });
          });
      
          it('팀내 선수 전체의 경기 결과 정보가 없으면 BadRequestException을 발생시켜야 한다', async () => {
            mockPlayerStatsRepository.find.mockResolvedValue(undefined);
      
            const matchId = 1;
            const teamId = 1;
      
            await expect(service.getMembersMatchResult(matchId, teamId)).rejects.toThrow(BadRequestException);
          });

    });

    describe('getMembers - (팀내 선수 전체) 정보 가져오기', () => {

        it('팀내 선수 전체의 경기 결과 정보가 있으면 반환해야 한다', async () => {
            const mockMemberStats = [
              { /* 선수 정보 객체 */ },
              { /* 선수 정보 객체 */ },
            ];
            mockPlayerStatsRepository.find.mockResolvedValue(mockMemberStats);
      
            const matchId = 1;
            const teamId = 1;
            const result = await service.getMembersMatchResult(matchId, teamId);
      
            expect(result).toEqual(mockMemberStats);
            expect(mockPlayerStatsRepository.find).toHaveBeenCalledWith({
              where: {
                match_id: matchId,
                team_id: teamId,
              },
            });
          });
      
          it('팀내 선수 전체의 경기 결과 정보가 없으면 BadRequestException을 발생시켜야 한다', async () => {
            mockPlayerStatsRepository.find.mockResolvedValue(null);
      
            const matchId = 1;
            const teamId = 1;
      
            await expect(service.getMembersMatchResult(matchId, teamId)).rejects.toThrow(BadRequestException);
          });


    });

    describe('resultPlayerCreate - 경기 후 선수 기록 등록', () => {
        const createplayerStatsDto:createPlayerStatsDto = { 
            clean_sheet:0, 
            assists:1, 
            goals:0,
            yellowCards:0,
            redCards:0,
            substitions:0,
            save:0
        };

        it('선수 기록 등록 성공 시나리오', async () => {
            const userId = 1;
            const matchId = 2;
            const memberId = 1;

            jest.spyOn(service, 'findIfMatchOver').mockResolvedValue(true);
            jest.spyOn(service, 'verifyTeamCreator').mockResolvedValue([{ id: userId } as any]);
            jest.spyOn(service, 'verifyOneMatch').mockResolvedValue({ id: matchId } as Match);
            jest.spyOn(service, 'isTeamMember').mockResolvedValue(true as any);
            mockPlayerStatsRepository.create.mockReturnValue({ id:1 });
            mockPlayerStatsRepository.save.mockResolvedValue({ id:1 });
      
            const result = await service.resultPlayerCreate(userId, matchId, memberId, createplayerStatsDto);
      
            expect(result).toBeDefined();
            expect(mockPlayerStatsRepository.create).toHaveBeenCalled();
            expect(mockPlayerStatsRepository.save).toHaveBeenCalled();
            expect(mockRedisService.delTeamStats).toHaveBeenCalledWith(userId);
          });
      
          it('경기가 끝나지 않았을 때 BadRequestException 발생', async () => {
            jest.spyOn(service, 'findIfMatchOver').mockImplementation(async () => {
              throw new BadRequestException('경기가 아직 안끝났습니다.');
            });
      
            const userId = 1;
            const matchId = 2;
            const memberId = 1;
      
            await expect(
              service.resultPlayerCreate(userId, matchId, memberId, createplayerStatsDto)
            ).rejects.toThrow(BadRequestException);
          });
      

    });

    describe('resultMathfinal - 경기 후 선수 기록 저장 및 팀별 기록 업데이트', () => {
        const userId = 1;
        const matchId = 2;
        const resultMembersDto: ResultMembersDto = {
          results: [
            {
              memberId: 1,
              goals: 2,
              assists: 1,
              yellowCards: 0,
              redCards: 0,
              save: 0,
            },
          ],
        };

        const queryRunnerMock = {
          connect: jest.fn().mockResolvedValue(undefined),
          startTransaction: jest.fn().mockResolvedValue(undefined),
          manager: {
            save: jest.fn().mockResolvedValue(undefined),
            update: jest.fn().mockResolvedValue(undefined), 
          },
          commitTransaction: jest.fn().mockResolvedValue(undefined),
          rollbackTransaction: jest.fn().mockResolvedValue(undefined),
          release: jest.fn().mockResolvedValue(undefined),
        };

        beforeEach(() => {
  
          mockDataSource.createQueryRunner = jest.fn().mockReturnValue({
            connect: jest.fn().mockResolvedValue(undefined),
            startTransaction: jest.fn().mockResolvedValue(undefined),
            manager: {
              save: jest.fn().mockResolvedValue(undefined),
              update: jest.fn().mockResolvedValue(undefined), 
            },
            commitTransaction: jest.fn().mockResolvedValue(undefined),
            rollbackTransaction: jest.fn().mockResolvedValue(undefined),
            release: jest.fn().mockResolvedValue(undefined),
          });

          jest.spyOn(service, 'findIfMatchOver').mockResolvedValue(true);
          jest.spyOn(service, 'verifyTeamCreator').mockResolvedValue([{ id: userId } as any]);
          jest.spyOn(service, 'verifyOneMatch').mockResolvedValue({ id: matchId } as Match);
          jest.spyOn(service, 'isTeamMember').mockResolvedValue(true as any);
      });
    
        it('경기 후 선수 기록 및 팀별 기록 업데이트 성공 시나리오', async () => {
          jest.spyOn(service, 'findIfMatchOver').mockResolvedValue(true);
          jest.spyOn(service, 'verifyTeamCreator').mockResolvedValue([{ id: userId } as any]);
          jest.spyOn(service, 'verifyOneMatch').mockResolvedValue({ id: matchId } as Match);
          jest.spyOn(service, 'isTeamMember').mockResolvedValue(true as any);
          mockMatchResultRepository.find.mockResolvedValue([{id:1},{id:2}]);
          mockMatchResultRepository.count.mockResolvedValue(1);
          mockTeamStatsRepository.create.mockImplementation((data) => data);
          mockTeamStatsRepository.save.mockResolvedValue({});

          mockDataSource.createQueryRunner.mockReturnValue(queryRunnerMock);
    
          await service.resultMathfinal(userId, matchId, resultMembersDto);
    
          expect(queryRunnerMock.commitTransaction).toHaveBeenCalled();
        });

        it('트랜잭션 중 에러 발생 시 롤백이 이루어져야 한다', async () => {

          mockDataSource.createQueryRunner.mockReturnValue(queryRunnerMock);

          queryRunnerMock.manager.save.mockImplementation(() => {
            throw new Error('DB Error');
          });
        
          await expect(service.resultMathfinal(userId, matchId, resultMembersDto)).rejects.toThrow();
        
          expect(queryRunnerMock.rollbackTransaction).toHaveBeenCalled();

          expect(queryRunnerMock.release).toHaveBeenCalled();
        });
    
        it('경기가 끝나지 않았을 때 BadRequestException 발생', async () => {
          jest.spyOn(service, 'findIfMatchOver').mockImplementation(async () => {
            throw new BadRequestException('경기가 아직 안끝났습니다.');
          });
    
          await expect(service.resultMathfinal(userId, matchId, resultMembersDto)).rejects.toThrow(BadRequestException);
        });

        it('playerStats 객체 생성에 실패하면 NotFoundException을 던져야 한다', async () => {
            mockPlayerStatsRepository.create.mockReturnValue(undefined);

            jest.spyOn(service, 'verifyOneMatch').mockResolvedValue({ id: matchId } as Match);
            jest.spyOn(service, 'isTeamMember').mockResolvedValue(true as any);
        
            await expect(service.resultMathfinal(userId, matchId, resultMembersDto)).rejects.toThrow(NotFoundException);
        
            expect(service.verifyOneMatch).toHaveBeenCalledWith(matchId, expect.anything());
            expect(service.isTeamMember).toHaveBeenCalledTimes(resultMembersDto.results.length);
        });

        it('경기 결과가 없으면 NotFoundException을 발생시켜야 한다', async () => {
            mockMatchResultRepository.count.mockResolvedValue(0); 
            jest.spyOn(service, 'verifyOneMatch').mockResolvedValue({ id: matchId } as Match);
            
            await expect(service.resultMathfinal(userId, matchId, resultMembersDto)).rejects.toThrow(NotFoundException);
        });
    
    });

    
    describe('findTeamMatches - 팀 전체 경기 일정 조회', () => {
        it('팀 전체 경기 일정 조회 성공 시나리오', async () => {
        const teamId = 1;
        const mockTeamMatches = [
            { id: 1, home_team_id: teamId, away_team_id: 2 },
            { id: 2, home_team_id: 2, away_team_id: teamId },
        ];
        mockMatchRepository.find.mockResolvedValue(mockTeamMatches);

        const result = await service.findTeamMatches(teamId);

        expect(result).toEqual(mockTeamMatches);
        expect(matchRepository.find).toHaveBeenCalledWith({
            where: [{ home_team_id: teamId }, { away_team_id: teamId }],
        });
        });

        it('팀에서 진행한 경기가 없을 때 NotFoundException 발생', async () => {
        const teamId = 1;
        mockMatchRepository.find.mockResolvedValue(undefined);

        await expect(service.findTeamMatches(teamId)).rejects.toThrow(NotFoundException);
        });
    });

    describe('findMatchDetail - 경기 세부 조회', () => {
        it('경기 세부 조회 성공 시나리오', async () => {
          const matchId = 1;
          const mockTeamMatches = [
            { id: 1, match_id: matchId, team_id: 1, goals: 2 },
            { id: 2, match_id: matchId, team_id: 2, goals: 3 },
          ];
          mockMatchResultRepository.find.mockResolvedValue(mockTeamMatches);
    
          const result = await service.findMatchDetail(matchId);
    
          expect(result).toEqual(mockTeamMatches);
          expect(mockMatchResultRepository.find).toHaveBeenCalledWith({
            where: { match_id: matchId },
          });
        });
    
        it('경기 기록이 없을 때 NotFoundException 발생', async () => {
          const matchId = 1;
          mockMatchResultRepository.find.mockResolvedValue(undefined);
    
          await expect(service.findMatchDetail(matchId)).rejects.toThrow(NotFoundException);
        });
    });

    describe('verifyTeamCreator - 구단주 검증', () => {

        it('구단주 검증 성공 시나리오', async () => {
            const userId = 1;

            jest.spyOn(awsService, 'presignedUrl').mockResolvedValue('http://example.com/image.jpg');

            mockTeamModelRepository.createQueryBuilder().getMany.mockResolvedValue([
                { id: 1, creator_id: userId, name: 'Team A', imageUUID: 'uuid', location_id: 1 },
            ]);
            mockUserRepository.findOne.mockResolvedValue({ id: userId, email: 'user@example.com' } as User);
        
            const result = await service.verifyTeamCreator(userId);

            expect(awsService.presignedUrl).toHaveBeenCalledWith('uuid');

        
            expect(result[0]).toHaveProperty('email', 'user@example.com');
            expect(result[0]).toHaveProperty('imageUrl', 'http://example.com/image.jpg');
        });
    
        it('구단주가 아닐 경우 BadRequestException 발생', async () => {
            const userId = 888; 
            mockTeamModelRepository.createQueryBuilder().getMany.mockResolvedValue([]);
        
            await expect(service.verifyTeamCreator(userId)).rejects.toThrow(BadRequestException);
        });

    });

    describe('verifyOneMatch - 경기 일정 조회+요청자 팀 검증', () => {

        it('경기 일정 조회 및 요청자 팀 검증 성공 시나리오', async () => {
            const matchId = 1;
            const teamId = 1;
            const mockMatch = { id: matchId, home_team_id: teamId, away_team_id: 2 };
            mockMatchRepository.createQueryBuilder().getOne.mockResolvedValue(mockMatch);
        
            const result = await service.verifyOneMatch(matchId, teamId);
        
            expect(result).toEqual(mockMatch);
            });
        
            it('해당 ID의 경기 일정이 존재하지 않을 경우 NotFoundException 발생', async () => {
            const matchId = 999; 
            const teamId = 1;
            mockMatchRepository.createQueryBuilder().getOne.mockResolvedValue(undefined);
        
            await expect(service.verifyOneMatch(matchId, teamId)).rejects.toThrow(NotFoundException);
            });
        
            it('요청자 팀이 경기에 참여하지 않은 경우 NotFoundException 발생', async () => {
            const matchId = 1;
            const teamId = 999; 
            mockMatchRepository.createQueryBuilder().getOne.mockResolvedValue(undefined);
        
            await expect(service.verifyOneMatch(matchId, teamId)).rejects.toThrow(NotFoundException);
            });

    });

    describe('createTeamStats - 경기 후 팀 스탯 생성', () => {
        it('팀 스탯 생성 성공 시나리오', async () => {
            const mockMatchResult = {
                match_id: 1,
                goals: [{ count: 1 }] 
            };
            const mockMatch = {
                id: 1,
                home_team_id: 1,
                away_team_id: 2
            }; 
            const mockMatchDetailHome = { goals: [{ count: 2 }] }; 
            const mockMatchDetailAway = { goals: [{ count: 1 }] }; 
    
            jest.spyOn(service, 'findOneMatch').mockResolvedValue(mockMatch as any); 
            jest.spyOn(service, 'isMatchDetail')
                .mockResolvedValueOnce(mockMatchDetailHome as any) 
                .mockResolvedValueOnce(mockMatchDetailAway as any); 
    
            const result = await service.createTeamStats(mockMatchResult);
    
            expect(result).toEqual({
                home_win: 1,
                home_lose: 0,
                home_draw: 0,
                home_score: 2,
                away_win: 0,
                away_lose: 1,
                away_draw: 0,
                away_score: 1,
            });
        });
    
        it('해당 ID의 경기 일정이 존재하지 않을 경우 NotFoundException 발생', async () => {
            const mockMatchResult = { match_id: 999 }; 
    
            jest.spyOn(service, 'findOneMatch').mockResolvedValue(undefined); 
    
            await expect(service.createTeamStats(mockMatchResult)).rejects.toThrow(NotFoundException);
        });
    });

    describe('findAllSoccerField - 경기장 전체 조회', () => {
        it('등록된 경기장 목록이 있는 경우', async () => {
          const mockSoccerFields = [{
            locationfield: {
              address: '테스트 주소',
              state: '테스트 주',
              city: '테스트 시',
              district: '테스트 구',
            },
          }];
    
          mockSoccerFieldRepository.find.mockResolvedValue(mockSoccerFields);
    
          const result = await service.findAllSoccerField();
    
          expect(result).toEqual(mockSoccerFields);
          expect(mockSoccerFieldRepository.find).toHaveBeenCalledWith({
            relations: {
              locationfield: true,
            },
            select: {
              locationfield: {
                address: true,
                state: true,
                city: true,
                district: true,
              },
            },
          });
        });
    
        it('등록된 경기장 목록이 없는 경우 NotFoundException 발생', async () => {
            mockSoccerFieldRepository.find.mockResolvedValue(undefined);
    
          await expect(service.findAllSoccerField()).rejects.toThrow(NotFoundException);
        });
    });

    describe('findAvailableTimes - 예약 가능 시간 조회', () => {
        it('예약 가능한 시간을 정확히 조회해야 한다', async () => {
            const date = '2024-02-25';
            const locationId = 1;
            const expectedAvailableTimes = [
                { time: '10:00:00', status: '예약 가능' },
                { time: '12:00:00', status: '예약 가능' },
                { time: '14:00:00', status: '예약 가능' },
                { time: '16:00:00', status: '예약 가능' },
                { time: '18:00:00', status: '예약 가능' },
                { time: '20:00:00', status: '예약 가능' },
            ];

            jest.spyOn(mockMatchRepository, 'find').mockResolvedValue([
                { id: 1, date: '2024-02-25', time: '10:00:00', soccer_field_id: 172 },
            ]);

            jest.spyOn(mockSoccerFieldRepository, 'findOne').mockResolvedValue({
                id: locationId,
              });

            const availableTimes = await service.findAvailableTimes(date, locationId);

            expect(availableTimes).toEqual(expectedAvailableTimes);
        });
    });

    describe('getTeamOwners - 구단주 전체 명단 조회', () => {
        it('유저 아이디가 아닌 모든 구단주를 조회해야 한다', async () => {
          const mockTeamOwners = [
            { id: 2, imageUUID: 'uuid1', name: 'TeamOwner1', creator: { id: 2, email: 'owner1@example.com', name: 'Owner1' } },
            { id: 3, imageUUID: 'uuid2', name: 'TeamOwner2', creator: { id: 3, email: 'owner2@example.com', name: 'Owner2' } },
          ];
      
          jest.spyOn(mockTeamModelRepository, 'find').mockResolvedValue(mockTeamOwners);
      
          jest.spyOn(awsService, 'presignedUrl').mockImplementation(async (uuid) => `https://example.com/${uuid}`);
      
          const userId = 1; 
          const result = await service.getTeamOwners(userId);
      
          expect(result).toEqual(mockTeamOwners.map((owner) => ({
            ...owner,
            imageUrl: `https://example.com/${owner.imageUUID}`,
          })));

          expect(teamRepository.find).toHaveBeenCalledWith({
            relations: {
              creator: true,
            },
            select: {
              id: true,
              imageUUID: true,
              name: true,
              gender: true,
              description: true,
              creator: {
                id: true,
                email: true,
                name: true,
              },
            },
            where: {
              creator: {
                id: Not(userId),
              },
            },
          });
      
          mockTeamOwners.forEach((owner) => {
            expect(awsService.presignedUrl).toHaveBeenCalledWith(owner.imageUUID);
          });
        });
      
        it('구단주 명단이 없을 경우 BadRequestException을 발생시킨다', async () => {
          jest.spyOn(teamRepository, 'find').mockResolvedValue([]);
      
          const userId = 1; 
      
          await expect(service.getTeamOwners(userId)).rejects.toThrow(BadRequestException);
        });
    });

    describe('isMatchDetail - 경기 상세 조회', () => {
        it('경기 상세 정보를 정확히 조회해야 한다', async () => {
          const mockMatchDetail = {
            id: 1,
            match_id: 1,
            team_id: 1,
          };
      
          jest.spyOn(mockMatchResultRepository, 'findOne').mockResolvedValue(mockMatchDetail);
      
          const matchId = 1; 
          const teamId = 1; 
          const result = await service.isMatchDetail(matchId, teamId);
      
          expect(result).toEqual(mockMatchDetail);
      
          expect(mockMatchResultRepository.findOne).toHaveBeenCalledWith({
            where: { match_id: matchId, team_id: teamId },
          });
        });
      
        it('경기 상세 정보가 없을 경우 undefined를 반환한다', async () => {
          jest.spyOn(mockMatchResultRepository, 'findOne').mockResolvedValue(undefined);
      
          const matchId = 1; 
          const teamId = 1; 
          const result = await service.isMatchDetail(matchId, teamId);
      
          expect(result).toBeUndefined();
        });
    });

    describe('getTeamSchedule - 팀별 일정 조회', () => {
        it('팀 일정 조회 성공 시나리오', async () => {
          const teamId = 1; 
          const userId = 1; 
          const mockRawResults = [
            { field_name: 'Field A', date: '2024-02-25', image_uuid: 'uuid1', name: 'Team A', opponent_team_id: 2, time: '15:00:00', match_id: 1 },
          ];
          
          jest.spyOn(service, 'isTeamMemberByUserId').mockResolvedValue(true as any);
          
          jest.spyOn(mockDataSource, 'query').mockResolvedValue(mockRawResults);
          
          jest.spyOn(awsService, 'presignedUrl').mockResolvedValue('http://example.com/image.jpg');
          
          const result = await service.getTeamSchedule(teamId, userId);
          
          expect(result).toEqual(mockRawResults.map(match => ({ ...match, imageUrl: 'http://example.com/image.jpg' })));
          
          expect(service.isTeamMemberByUserId).toHaveBeenCalledWith(teamId, userId);
          
          expect(mockDataSource.query).toHaveBeenCalled();
        });
      
        it('팀의 멤버가 아닐 경우 NotFoundException 발생', async () => {
          const teamId = 1; 
          const userId = 1; 
          
          jest.spyOn(service, 'isTeamMemberByUserId').mockRejectedValue(new NotFoundException('팀의 멤버가 아닙니다.'));
          
          await expect(service.getTeamSchedule(teamId, userId)).rejects.toThrow(NotFoundException);
        });
    });
      
    describe('getMember - 경기별 팀별 멤버 조회', () => {
        it('개인 멤버 정보 조회 성공 시나리오', async () => {
          const userId = 1; 
          const mockMember = {
            user: {
              id: userId,
              email: 'user@example.com',
              name: 'Test User',
              profile: {
                id: 1,
                skillLevel: 'Intermediate',
              },
            },
            team: {
              id: 1,
            },
            playerstats: [
            ],
          };
          
          jest.spyOn(mockMemberRepository, 'findOne').mockResolvedValue(mockMember);
          
          const result = await service.getMember(userId);
          
          expect(result).toEqual(mockMember);
          
          expect(mockMemberRepository.findOne).toHaveBeenCalledWith({
            relations: {
              user: {
                profile: true,
              },
              team: true,
              playerstats: {
                match:true
              },
            },
            select: {
              user: {
                id: true,
                email: true,
                name: true,
                profile: {
                    age: true,
                    birthdate: true,
                    gender: true,
                    height: true,
                    id: true,
                    imageUUID: true,
                    phone: true,
                    preferredPosition: true,
                    skillLevel: true,
                    weight: true,
                },
              },
              team: {
                id: true,
              },
              playerstats: {
                assists: true,
                clean_sheet: true,
                goals: true,
                id: true,
                match:  {
                    away_team_id: true,
                    date: true,
                    home_team_id: true,
                    id: true,
                    result: true,
                    soccer_field_id: true,
                    time: true,
                },
                match_id: true,
                red_cards: true,
                save: true,
                substitutions: true,
                yellow_cards: true,
              },
            },
            where: {
              user: {
                id: userId,
              },
            },
          });
        });
      
        it('멤버 정보가 없을 경우 BadRequestException 발생', async () => {
          const userId = 999; 
          
          jest.spyOn(mockMemberRepository, 'findOne').mockResolvedValue(null);
          
          await expect(service.getMember(userId)).rejects.toThrow(BadRequestException);
        });
    });


    describe('getTeamMembers- 경기별 팀별 멤버 조회', () => {
        it('경기별 팀별 멤버 조회 성공 시나리오', async () => {
          const matchId = 1; 
          const teamId = 1; 
          const mockMembers = [
            {
              id: 1,
              isStaff: false,
              user: {
                id: 1,
                name: 'Test User 1',
                email: 'user1@example.com',
              },
              matchformation: {
                position: 'Forward',
              },
            },
          ];
          
          jest.spyOn(mockMemberRepository, 'find').mockResolvedValue(mockMembers);
          
          const result = await service.getTeamMembers(matchId, teamId);
          
          expect(result).toEqual(mockMembers);
          
          expect(mockMemberRepository.find).toHaveBeenCalledWith({
            select: {
              id: true,
              isStaff: true,
              user: {
                id: true,
                name: true,
                email: true,
              },
              matchformation: {
                position: true,
              },
            },
            where: {
              team: {
                id: teamId,
              },
              matchformation: {
                team_id: teamId,
                match_id: matchId,
              },
            },
            relations: {
              team: true,
              user: true,
              matchformation: true,
            },
          });
        });
    });
    
    describe('isTeamMemberByUserId - 팀 특정 멤버 조회', () => {
        it('팀의 멤버일 경우 해당 멤버 정보를 반환해야 한다', async () => {
          const teamId = 1; 
          const userId = 1; 
          const mockMember = {
            id: 1,
            team_id: teamId,
            user_id: userId,
          };
      
          jest.spyOn(mockMemberRepository, 'createQueryBuilder').mockReturnValue({
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockResolvedValue(mockMember),
          });
      
          const result = await service.isTeamMemberByUserId(teamId, userId);
      
          expect(result).toEqual(mockMember);
      
          expect(mockMemberRepository.createQueryBuilder).toHaveBeenCalled();
        });
      
        it('팀의 멤버가 아닐 경우 NotFoundException을 던져야 한다', async () => {
          const teamId = 2;
          const userId = 2;
      
          jest.spyOn(mockMemberRepository, 'createQueryBuilder').mockReturnValue({
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockResolvedValue(undefined),
          });
      
          await expect(service.isTeamMemberByUserId(teamId, userId)).rejects.toThrow(NotFoundException);
        });
    });

    describe('isTeamMember - 팀멤버 검증', () => {
      
        it('멤버가 존재할 경우 멤버 정보를 반환해야 한다', async () => {
          const teamId = 1;
          const memberId = 1;
          const mockMember = { id: memberId, team_id: teamId }; 
      
          mockMemberRepository.createQueryBuilder().getOne.mockResolvedValue(mockMember);
      
          const result = await service.isTeamMember(teamId, memberId);
          expect(result).toEqual(mockMember);
        });
      
        it('멤버가 존재하지 않을 경우 NotFoundException을 던져야 한다', async () => {
          const teamId = 1;
          const memberId = 999; 
      
          mockMemberRepository.createQueryBuilder().getOne.mockResolvedValue(undefined);
      
          await expect(service.isTeamMember(teamId, memberId)).rejects.toThrow(NotFoundException);
        });
    });
      
    describe('verifyReservedMatch - 경기 예약 확인', () => {
      
        it('경기가 예약되지 않았다면 예외를 던지지 않아야 한다', async () => {
          const date = '2024-01-01';
          const time = '10:00:00';
      
          mockMatchRepository.findOne.mockResolvedValue(undefined);
      
          await expect(service.verifyReservedMatch(date, time)).resolves.toBeUndefined();
        });
      
        it('경기가 이미 예약되어 있다면 BadRequestException을 던져야 한다', async () => {
          const date = '2024-01-01';
          const time = '10:00:00';
          const mockMatch = { id: 1, date, time }; 
      
          mockMatchRepository.findOne.mockResolvedValue(mockMatch);
      
          await expect(service.verifyReservedMatch(date, time)).rejects.toThrow(BadRequestException);
        });
    });
    
    describe('matchResultCount - 경기결과 카운트', () => {
      
        it('경기 결과가 없을 때, count가 0이고 team이 빈 객체이어야 한다', async () => {
          const matchId = 1; 
          mockMatchResultRepository.count.mockResolvedValue(0); 
      
          const result = await service.matchResultCount(matchId);
      
          expect(result.count).toBe(0);
          expect(result.team).toEqual({});
          expect(mockMatchResultRepository.count).toHaveBeenCalledWith({ where: { match_id: matchId } });
          expect(mockMatchResultRepository.findOne).not.toHaveBeenCalled();
        });
      
        it('경기 결과가 있을 때, count가 1 이상이고 team에 정보가 포함되어야 한다', async () => {
          const matchId = 1; 
          const mockTeam = { id: 1, name: 'Test Team' }; 
          mockMatchResultRepository.count.mockResolvedValue(1);
          mockMatchResultRepository.findOne.mockResolvedValue(mockTeam); 
      
          const result = await service.matchResultCount(matchId);
      
          expect(result.count).toBeGreaterThan(0);
          expect(result.team).toEqual(mockTeam);
          expect(mockMatchResultRepository.count).toHaveBeenCalledWith({ where: { match_id: matchId } });
          expect(mockMatchResultRepository.findOne).toHaveBeenCalledWith({ where: { match_id: matchId } });
        });
    });

    describe('getMatchResultByMatchId - 경기 결과 조회 (경기번호로)', () => {

        it('경기 결과가 존재할 경우, 올바른 형식으로 결과를 반환해야 한다', async () => {
          const matchId = 1;
          const teamId = 1;
          const mockMatchResult = [
          ];
          const mockMatch = {
            id: matchId,
            home_team_id: 1,
            away_team_id: 2,
            date: '2023-01-01',
            time: '15:00:00',
          };
      
          mockMatchResultRepository.find.mockResolvedValue(mockMatchResult);
          mockMatchRepository.findOne.mockResolvedValue(mockMatch);
      
          const result = await service.getMatchResultByMatchId(matchId, teamId);
      
          expect(result).toHaveProperty('date');
          expect(result).toHaveProperty('time');

          if (result.hasOwnProperty('home')) {
              expect((result as any).home.counted_goals).toEqual(3);
              expect((result as any).home.counted_yellow_cards).toEqual(2);
              expect((result as any).home.counted_red_cards).toEqual(1);
              expect((result as any).home.counted_saves).toEqual(3);
          }
      
          expect(mockMatchResultRepository.find).toHaveBeenCalledWith(expect.any(Object));
          expect(mockMatchRepository.findOne).toHaveBeenCalledWith({ where: { id: matchId } });
        });

        it('경기 결과에 homeTeamId와 awayTeamId가 정확하게 매핑되어야 한다', async () => {

          interface MatchResult {
            home?: MatchTeamResult; 
            away?: MatchTeamResult; 
            date: string;
            time: string;
          }

          interface MatchTeamResult {
            team_id: number;
            counted_goals: number;
          }

          const homeTeamId = 1;
          const awayTeamId = 2;
          const matchId = 3;
          const mockResults = [
            { team_id: homeTeamId, goals: [{ count: 2 }], yellow_cards: [], red_cards: [], saves: [{ count: 1 }] },
            { team_id: awayTeamId, goals: [{ count: 1 }], yellow_cards: [], red_cards: [], saves: [{ count: 3 }] }
        ];
          const mockMatch = {
            id: matchId,
            home_team_id: 1,
            away_team_id: 2,
            date: '2023-01-01',
            time: '15:00:00',
          };

          mockMatchResultRepository.find.mockResolvedValue(mockResults);
          mockMatchRepository.findOne.mockResolvedValue(mockMatch);

          const result = await service.getMatchResultByMatchId(matchId, homeTeamId) as MatchResult;

          expect(result.home).toBeDefined();
          expect(result.away).toBeDefined();
          expect(result.home.team_id).toEqual(homeTeamId);
          expect(result.away.team_id).toEqual(awayTeamId);
      });
  
      it('경기 결과의 goals와 saves를 정확하게 계산하여 반영해야 한다', async () => {

          interface MatchResult {
            home?: MatchTeamResult; 
            away?: MatchTeamResult; 
            date: string;
            time: string;
          }

          interface MatchTeamResult {
            team_id: number;
            counted_goals: number;
            counted_saves: number;
            yellow_cards:number;
            red_cards:number;
            saves:[{count:number}]
            goals:[{count:number}]
          }

          const matchId = 3;
          const homeTeamId = 1;
          const awayTeamId = 2;
          const mockResults = [
            { team_id: homeTeamId, goals: [{ count: 2 }], yellow_cards: [], red_cards: [], saves: [{ count: 1 }] },
            { team_id: awayTeamId, goals: [{ count: 1 }], yellow_cards: [], red_cards: [], saves: [{ count: 3 }] }
        ];
          const mockMatch = {
            id: matchId,
            home_team_id: 1,
            away_team_id: 2,
            date: '2023-01-01',
            time: '15:00:00',
          };

          mockMatchResultRepository.find.mockResolvedValue(mockResults);
          mockMatchRepository.findOne.mockResolvedValue(mockMatch);

          const result = await service.getMatchResultByMatchId(matchId, homeTeamId) as MatchResult;

          expect(result.home?.counted_goals).toBe(2); 
          expect(result.home?.counted_saves).toBe(1); 
          expect(result.away?.counted_goals).toBe(1); 
          expect(result.away?.counted_saves).toBe(3);
  
      });
      
      it('경기 결과가 존재하지 않을 경우, NotFoundException을 발생시켜야 한다', async () => {
        const matchId = 2;
        const teamId = 1;
    
        mockMatchResultRepository.find.mockResolvedValue(undefined);
        mockMatchRepository.findOne.mockResolvedValue(undefined);
    
        await expect(service.getMatchResultByMatchId(matchId, teamId)).rejects.toThrow(NotFoundException);
    
        expect(mockMatchResultRepository.find).toHaveBeenCalledWith({
          where: { match_id: matchId },
          relations: { match: true },
          select: expect.any(Object),
        });
        expect(mockMatchRepository.findOne).toHaveBeenCalledWith({ where: { id: matchId } });
      });
    });
      
    describe('getMatchResultExist', () => {
      
        it('경기 결과가 존재할 경우, 해당 결과를 반환해야 한다', async () => {
          const matchId = 1;
          const mockResult = { id: matchId, goals: 2 }; 
          mockMatchResultRepository.findOne.mockResolvedValue(mockResult);
      
          const result = await service.getMatchResultExist(matchId);
      
          expect(result).toEqual(mockResult);
          expect(mockMatchResultRepository.findOne).toHaveBeenCalledWith({
            where: { match_id: matchId },
          });
        });
      
        it('경기 결과가 존재하지 않을 경우, NotFoundException을 발생시켜야 한다', async () => {
          const matchId = 999; 
          mockMatchResultRepository.findOne.mockResolvedValue(undefined);
      
          await expect(service.getMatchResultExist(matchId)).rejects.toThrow(NotFoundException);
          expect(mockMatchResultRepository.findOne).toHaveBeenCalledWith({
            where: { match_id: matchId },
          });
        });
    });
});
    

