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
        update: jest.fn().mockResolvedValue({ affected: 1 }), // update 메서드 추가
    } as unknown as Repository<Match>;
    let dataSource: DataSource;

    const mockRedisService = {
        connect: jest.fn().mockResolvedValue(true),
        disconnect: jest.fn().mockResolvedValue(true),
        delTeamStats: jest.fn(),
        // 필요한 경우 여기에 더 많은 메서드를 모킹할 수 있습니다.
    };

    const mockMatchRepository = {
        findOne: jest.fn(),
        find: jest.fn(),
        create: jest.fn().mockImplementation((matchData) => matchData),
        save: jest.fn().mockResolvedValue({
            // 저장 후 예상되는 match 객체
            id: 1,
            // 기타 필요한 필드와 값
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
                // 여기에 해당하는 팀 객체들의 배열을 반환
                { id: 1, name: 'Test Team 1', creator_id: 1 },
                { id: 2, name: 'Test Team 2', creator_id: 1 }
                // 필요에 따라 더 많은 팀 객체를 추가할 수 있습니다.
            ]),
        }),
        findOne: jest.fn().mockResolvedValue({
            id: 2,
            name: '상대 팀',
            creator: {
                email: 'away@example.com'
            },
            // 필요한 추가 속성
        })
    };
    const mockMatchResultRepository = {
        findOne: jest.fn().mockResolvedValue({
            id: 1,
            match_id: 2,
            team_id: 1,
            // 필요한 추가 속성
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
          update: jest.fn().mockResolvedValue(undefined), // update 메서드 모킹 추가
          // 필요한 다른 메서드들도 모킹...
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
                // 나머지 엔티티에 대한 모의 리포지토리 제공
                { provide: DataSource, useValue: mockDataSource},
            ],
        }).compile();

        service = module.get<MatchService>(MatchService);
        emailService = module.get<EmailService>(EmailService);
        awsService = module.get<AwsService>(AwsService);
        authService = module.get<AuthService>(AuthService);
        jwtService = module.get<JwtService>(JwtService); // JwtService 인스턴스 가져오기
        userRepository = module.get<Repository<User>>(getRepositoryToken(User)); // UserRepository 인스턴스 가져오기
        teamRepository = module.get<Repository<TeamModel>>(getRepositoryToken(TeamModel)); // TeamRepository 인스턴스 가져오기
        matchRepository = module.get<Repository<Match>>(getRepositoryToken(Match)); // MatchRepository 인스턴스 가져오기

        // 모의 메서드 구현
        (emailService.reqMatchEmail as jest.Mock).mockResolvedValue(true);
        (authService.generateAccessEmailToken as jest.Mock).mockReturnValue('some-token');
        (awsService.presignedUrl as jest.Mock).mockResolvedValue('imageUuid_some');
        redisService = module.get<RedisService>(RedisService);
        // Redis 연결 초기화
        await mockRedisService.connect();

        jest.clearAllMocks(); // 모든 모의 호출을 초기화

    });

    afterEach(async () => {
        // Redis 연결 종료
        await mockRedisService.disconnect();
    });

    describe('requestCreMatch - 경기 생성 이메일 요청(상대팀 구단주에게)', () => {

        let createRequestDto;

        beforeEach(async () => {

            // 필요한 메서드의 모의 구현
            jest.spyOn(service, 'verifyReservedMatch').mockResolvedValue(undefined);
            jest.spyOn(service, 'verifyTeamCreator').mockResolvedValue([
                { name: '구단주 이름' } as any
            ] );
    
            jest.spyOn(teamRepository, 'findOne').mockResolvedValue({
                id: 1, // 예시로 사용된 팀 ID
                name: 'Team Name', // 예시 팀 이름
                creator: {
                  name: 'Away Team',
                  email: 'away@example.com'
                },
                // 기타 필요한 필드에 대한 모킹 값...
            }as any);
    
            // 메서드 호출 및 결과 검증
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
    
        // 추가적인 에러 케이스에 대한 테스트도 구현
        it('경기 시간이 이미 예약되어 있다면 예외를 던져야 한다', async () => {
            jest.spyOn(service, 'verifyReservedMatch').mockRejectedValue(new BadRequestException('이미 예약된 경기 일정 입니다.'));
            const userId = 1;
            await expect(service.requestCreMatch(userId, createRequestDto)).rejects.toThrow(BadRequestException);
        });

    });

    describe('findOneMatch - 경기 일정 조회', () => {

        it('주어진 id에 대한 경기를 반환해야 한다', async () => {
            // 모의 match 객체
            const mockMatch = {
                id: 1,
                date: '2024-02-25',
                time: '18:00:00',
                // 기타 필요한 필드
            };
        
            // findOne 메서드가 mockMatch를 반환하도록 설정
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
            // findOne 메서드가 null을 반환하도록 설정
            mockMatchRepository.findOne.mockResolvedValue(null);
        
            const matchId = 999; // 존재하지 않는 ID
        
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
                    // ...기타 필요한 팀 정보...
                  },
                  // ...더 많은 팀 객체가 필요한 경우 추가...
                ]),
            } as any); // as any를 사용하여 타입 오류 회피

            jest.spyOn(matchRepository, 'save').mockImplementation(match => Promise.resolve({ 
                id: 1, // id를 포함하도록 모의 구현 수정
                ...match 
            } as Match));

            //jest.spyOn(teamRepository, 'findOne').mockResolvedValue({ id: 1, name: 'Test Team', creator: { email: 'test@example.com' }  } as TeamModel);
            jest.spyOn(matchRepository, 'create').mockImplementation(match => match as Match) ;
        });
    
        it('JWT 인증 성공 시 경기 생성', async () => {
            // 모의 함수 구현
            jest.spyOn(jwtService, 'verify').mockImplementation(async (token: string) => {
                return { id: 1 };
            });

            const result = await service.createMatch(createMatchDto);
    
            expect(jwtService.verify).toHaveBeenCalledWith(createMatchDto.token, expect.any(Object));
            expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
            //expect(teamRepository.findOne).toHaveBeenCalled();
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

            // 모의 함수 구현
            jest.spyOn(jwtService, 'verify').mockImplementation(async (token: string) => {
                return { id: 1 };
            });
        
            jest.spyOn(matchRepository, 'create').mockReturnValue(null); // match 객체 생성 실패를 모의
        
            await expect(service.createMatch(createMatchDto)).rejects.toThrow(NotFoundException);
        });

        it('사용자 정보가 유효하지 않으면 UnauthorizedException을 던져야 한다', async () => {
            // jwtService.verify가 유효한 ID를 반환하지 않도록 설정
            jest.spyOn(jwtService, 'verify').mockImplementation(async (token: string) => {
              throw new UnauthorizedException('사용자 정보가 유효하지 않습니다.');
            });
        
            const matchId = 1;
        
            // 예외 발생 검증
            await expect(service.createMatch(createMatchDto)).rejects.toThrow(UnauthorizedException);
          });
    
        // 추가적인 테스트 케이스 구현...
    });

    describe('findIfMatchOver - 경기가 끝났는지 조회', () => {


        it('경기 정보가 없을 경우 NotFoundException을 던진다', async () => {
            jest.spyOn(matchRepository, 'findOne').mockResolvedValue(undefined);
        
            await expect(service.findIfMatchOver(1)).rejects.toThrow(NotFoundException);
          });
        
          it('경기가 아직 끝나지 않았을 경우 NotFoundException을 던진다', async () => {
            const matchDate = new Date();
            matchDate.setHours(matchDate.getHours() + 1); // 현재보다 1시간 후로 설정
        
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
            matchDate.setHours(matchDate.getHours() - 3); // 현재보다 3시간 전으로 설정
        
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

            // 메서드 호출 및 결과 검증
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
                id: 1, // 예시로 사용된 팀 ID
                name: 'Team Name', // 예시 팀 이름
                creator: {
                  name: 'Away Team',
                  email: 'away@example.com'
                },
                // 기타 필요한 필드에 대한 모킹 값...
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

            // 메서드 호출 및 결과 검증
            updatematchDto = {
                token: 'valid-token',
                date: '2024-02-25',
                time: '18:00:00',
                reason: '기상악화',
            };
    
            // 구단주 검증 및 경기 조회 함수 모킹
            jest.spyOn(service, 'verifyTeamCreator').mockResolvedValue([
                { name: '구단주 이름' } as any
            ] );

            jest.spyOn(service, 'findOneMatch').mockResolvedValue({ id: 1, date: '2024-01-01', time: '15:00' } as Match);
    
            // 예약된 경기 일정 검증 모킹
            jest.spyOn(service, 'verifyReservedMatch').mockResolvedValue(undefined);
    
            // 경기 정보 업데이트 모킹
            //jest.spyOn(matchRepository, 'update').mockResolvedValue({ affected: 1 } as any);

            jest.spyOn(mockMatchRepository, 'update').mockImplementation(() => {
                return Promise.resolve({
                  affected: 1,
                  raw: [], // 이 값은 실제 사용에 맞게 조정할 수 있습니다.
                  generatedMaps: [] // 이 값은 실제 사용에 맞게 조정할 수 있습니다.
                });
            });

            //jest.spyOn(userRepository, 'findOne').mockResolvedValue({ id: 1, name: 'Test User' } as User);
        });
    
        it('경기 정보를 성공적으로 업데이트해야 한다', async () => {

            jest.spyOn(jwtService, 'verify').mockImplementation(async (token: string) => {
                return { id: 1 }; // 여기서 반환되는 객체가 userRepository.findOne에 제공되는 id 값에 영향을 줍니다.
            });

            const matchId = 1;
    
            const result = await service.updateMatch(matchId, updatematchDto);
    
            expect(result).toBeDefined();
            expect(jwtService.verify).toHaveBeenCalledWith(updatematchDto.token, expect.any(Object));
            //expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
            expect(mockMatchRepository.update).toHaveBeenCalledWith({ id: matchId }, { date: updatematchDto.date, time: updatematchDto.time });
        });

        it('사용자 정보가 유효하지 않으면 UnauthorizedException을 던져야 한다', async () => {
            // jwtService.verify가 유효한 ID를 반환하지 않도록 설정
            jest.spyOn(jwtService, 'verify').mockImplementation(async (token: string) => {
              throw new UnauthorizedException('사용자 정보가 유효하지 않습니다.');
            });
        
            const matchId = 1;
        
            // 예외 발생 검증
            await expect(service.updateMatch(matchId, updatematchDto)).rejects.toThrow(UnauthorizedException);
          });

    });

    describe('requestDelMatch - 경기 삭제 이메일 요청(상대팀 구단주에게)', () => {

        let deleterequestDto;

        beforeEach(() => {
            deleterequestDto = {
                reason: '날씨 악화로 인한 취소'
            };
    
            // Token 생성 모킹
            jest.spyOn(authService, 'generateAccessEmailToken').mockReturnValue('fake-token');
    
            // 구단주 검증 모킹
            jest.spyOn(service, 'verifyTeamCreator').mockResolvedValue([
                { name: '구단주 이름', id:1 } as any
            ] );
    
            // 경기 정보 조회 모킹
            jest.spyOn(service, 'verifyOneMatch').mockResolvedValue({
                id: 1,
                date: '2024-02-25',
                time: '15:00:00',
                home_team_id: 1,
                away_team_id: 2
            }as any);

            // 이메일 요청 모킹
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
            //expect(service.getTeamInfo).toHaveBeenCalledWith(2);
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
    
            // JWT 검증 모킹
            // 모의 함수 구현
            jest.spyOn(jwtService, 'verify').mockImplementation(async (token: string) => {
                return { id: 1 };
            });
    
            // 사용자 조회 모킹
            jest.spyOn(userRepository, 'findOne').mockResolvedValue({ id: 1, name: 'Test User' } as User);
    
            // 구단주 검증 모킹
            jest.spyOn(service, 'verifyTeamCreator').mockResolvedValue([
                { name: '구단주 이름',id: 1 } as any
            ] );
    
            // 경기 검증 모킹
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
                    // 필요한 경우 여기에 더 많은 메서드를 모킹할 수 있습니다.
                },
                commitTransaction: jest.fn().mockResolvedValue(null),
                rollbackTransaction: jest.fn().mockResolvedValue(null),
                release: jest.fn().mockResolvedValue(null),
            });
        });
    
        it('경기 삭제를 성공적으로 처리해야 한다', async () => {
            await expect(service.deleteMatch(deleteMatchDto, matchId)).resolves.toBeUndefined();
    
            expect(jwtService.verify).toHaveBeenCalledWith(deleteMatchDto.token, expect.any(Object));
            //expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
            expect(service.verifyTeamCreator).toHaveBeenCalledWith(1);
            expect(service.verifyOneMatch).toHaveBeenCalledWith(matchId, 1);
            expect(mockDataSource.createQueryRunner().manager.delete).toHaveBeenCalledWith('match_results', { match_id: matchId });
            expect(mockDataSource.createQueryRunner().manager.delete).toHaveBeenCalledWith('matches', { id: matchId });
        });

        it('사용자 정보가 유효하지 않으면 UnauthorizedException을 던져야 한다', async () => {
            // jwtService.verify가 유효한 ID를 반환하지 않도록 설정
            jest.spyOn(jwtService, 'verify').mockImplementation(async (token: string) => {
              throw new UnauthorizedException('사용자 정보가 유효하지 않습니다.');
            });
        
            const matchId = 1;
        
            // 예외 발생 검증
            await expect(service.deleteMatch(deleteMatchDto, matchId)).rejects.toThrow(UnauthorizedException);
        });

        // 예외 핸들링 테스트 케이스 추가
        it('경기 삭제 중 예외가 발생하면 InternalServerErrorException을 던져야 한다', async () => {
            // 경기 삭제 과정에서 오류를 던지도록 설정
            const queryRunner = mockDataSource.createQueryRunner();
            jest.spyOn(queryRunner.manager, 'delete').mockImplementation(() => {
            throw new Error('Database Error');
            });
        
            // 예외 발생 검증
            await expect(service.deleteMatch(deleteMatchDto, matchId)).rejects.toThrow(InternalServerErrorException);
        
            // 롤백이 호출되었는지 확인
            expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
        });
  
    
        // 추가적인 에러 핸들링 테스트 케이스도 구현할 수 있습니다.
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

        // substitionsDto 인스턴스 생성
        const mockSubstitionsDto: substitionsDto[] = [
            {
                inPlayerId: 2, // 교체 투입 선수 ID
                outPlayerId: 1, // 교체되어 나가는 선수 ID
            },
        ];

        // createMatchResultDto 인스턴스 생성
        const mockCreateMatchResultDto: createMatchResultDto = {
            cornerKick: 5, // 코너킥 횟수
            substitions: mockSubstitionsDto, // 교체 정보
            passes: 150, // 패스 횟수
            penaltyKick: 0, // 패널티킥 횟수
            freeKick: 6, // 프리킥 횟수
        };

        it('경기 결과 등록 성공 시나리오', async () => {
            const userId = 1;
            const matchId = 1;
      
            // 모의 구현
            jest.spyOn(service, 'findIfMatchOver').mockResolvedValue(true);
            jest.spyOn(service, 'verifyTeamCreator').mockResolvedValue([{ id: userId } as any]);
            jest.spyOn(service, 'verifyOneMatch').mockResolvedValue({ id: matchId } as Match);
            jest.spyOn(service, 'isMatchDetail').mockResolvedValue(null);
            jest.spyOn(service, 'chkResultMember').mockResolvedValue(true as any);
            const matchResult = mockMatchResultRepository.create.mockReturnValue({
                match_id: matchId,
                team_id: 1,
                cornerKick: 5, // 코너킥 횟수
                substitions: mockSubstitionsDto, // 교체 정보
                passes: 150, // 패스 횟수
                penaltyKick: 0, // 패널티킥 횟수
                freeKick: 6, // 프리킥 횟수
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
            // 트랜잭션 중 오류를 던지도록 설정
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

        const userId = 1;
        const matchId = 1;
  
        // 모의 구현
        jest.spyOn(service, 'findIfMatchOver').mockResolvedValue(true);
        jest.spyOn(service, 'verifyTeamCreator').mockResolvedValue([{ id: userId } as any]);
        jest.spyOn(service, 'verifyOneMatch').mockResolvedValue({ id: matchId } as Match);
        jest.spyOn(service, 'isMatchDetail').mockResolvedValue(null);
        jest.spyOn(service, 'chkResultMember').mockResolvedValue(true as any);
        // jest.spyOn(queryRunnerMock.manager, 'save').mockImplementation(() => {
        //   throw new InternalServerErrorException('서버 에러가 발생했습니다.');
        // });

        mockDataSource.createQueryRunner().manager.save.mockImplementation(() => {
          throw new Error('DB Error');
        });

        await expect(service.resultMatchCreate(userId, matchId, mockCreateMatchResultDto))
            .rejects
            .toThrow(InternalServerErrorException); // 롤백이 수행된 후 InternalServerErrorException이 발생해야 합니다.

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
              // 추가 선수 정보 객체...
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
              // 추가 선수 정보 객체...
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

            // 모의 구현
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
      
          // 예외 시나리오 테스트
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
            // 필요한 경우 여기에 추가 선수 결과를 포함
          ],
        };

        const queryRunnerMock = {
          connect: jest.fn().mockResolvedValue(undefined),
          startTransaction: jest.fn().mockResolvedValue(undefined),
          manager: {
            save: jest.fn().mockResolvedValue(undefined),
            update: jest.fn().mockResolvedValue(undefined), // update 메서드 모킹 추가
            // 필요한 다른 메서드들도 모킹...
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
              update: jest.fn().mockResolvedValue(undefined), // update 메서드 모킹 추가
              // 필요한 다른 메서드들도 모킹...
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
          // 여기에 더 많은 검증을 추가할 수 있습니다.
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

    //     it('팀 통계가 정상적으로 업데이트 되어야 한다', async () => {
    //       jest.spyOn(service, 'teamTotalGames').mockResolvedValue({ total_games: 1 } as any);
    //       jest.spyOn(service, 'verifyOneMatch').mockResolvedValue({ id: matchId } as any);
    //       jest.spyOn(mockTeamStatsRepository, 'findOne').mockResolvedValue({ wins: 0, loses: 0, draws: 0, total_games: 1 });
    //       mockTeamStatsRepository.update.mockResolvedValue({});
      
    //       await service.resultMathfinal(userId, matchId, resultMembersDto);
      
    //       expect(mockTeamStatsRepository.update).toHaveBeenCalled();
    //       expect(mockTeamStatsRepository.update).toHaveBeenCalledWith(
    //           { team_id: 1, id: expect.any(Number) },
    //           expect.objectContaining({
    //               wins: expect.any(Number),
    //               loses: expect.any(Number),
    //               draws: expect.any(Number),
    //               total_games: expect.any(Number),
    //           }),
    //       );
    //   });

    //   it('경기 결과가 이미 존재할 경우 NotFoundException을 던져야 한다', async () => {
    //     jest.spyOn(service, 'matchResultCount').mockResolvedValue({ count: 2 } as any); // 이미 두 팀의 결과가 등록되어 있음
    //     jest.spyOn(service, 'verifyOneMatch').mockResolvedValue({ id: matchId } as any);
    
    //     await expect(service.resultMathfinal(userId, matchId, resultMembersDto)).rejects.toThrow(NotFoundException);
    
    //     expect(service.matchResultCount).toHaveBeenCalledWith(matchId);
    // });    
      
        // it('팀 통계가 없으면 새로운 통계를 생성해야 한다', async () => {
        //     // 필요한 모킹
        //     //jest.spyOn(service, 'teamTotalGames').mockResolvedValue(undefined as any); // 팀 통계가 없음을 가정
        //     jest.spyOn(service, 'verifyOneMatch').mockResolvedValue({ id: 2 } as Match);
        //     jest.spyOn(mockTeamStatsRepository, 'findOne').mockResolvedValue(undefined); // findOne이 팀 통계를 찾지 못함을 모킹
        //     mockTeamStatsRepository.create.mockImplementation((data) => data); // create 메서드 모킹
        //     mockTeamStatsRepository.save.mockResolvedValue({}); // save 메서드 모킹
    
        //     const userId = 1;
        //     const matchId = 2;
        //     const teamStatsDto = {
        //         // DTO 구성
        //         id:1
        //     };
    
        //     // 실제 함수 호출
        //     await service.resultMathfinal(userId, matchId, resultMembersDto);
    
        //     // teamTotalGames와 findOne이 호출되었는지 검증
        //     //expect(service.teamTotalGames).toHaveBeenCalledWith(expect.any(Number));
        //     expect(mockTeamStatsRepository.findOne).toHaveBeenCalledWith(expect.any(Object));
    
        //     // 새 팀 통계 객체가 생성되었는지 검증
        //     expect(mockTeamStatsRepository.create).toHaveBeenCalledWith(expect.any(Object));
        //     expect(mockTeamStatsRepository.save).toHaveBeenCalledWith(expect.any(Object));
        // });
    
        // 예외 시나리오 테스트
        it('경기가 끝나지 않았을 때 BadRequestException 발생', async () => {
          jest.spyOn(service, 'findIfMatchOver').mockImplementation(async () => {
            throw new BadRequestException('경기가 아직 안끝났습니다.');
          });
    
          await expect(service.resultMathfinal(userId, matchId, resultMembersDto)).rejects.toThrow(BadRequestException);
        });

        // 경기 후 선수 기록 및 팀별 기록 업데이트 예외 시나리오 테스트
        it('playerStats 객체 생성에 실패하면 NotFoundException을 던져야 한다', async () => {
            // playerStats 생성 실패를 모킹
            mockPlayerStatsRepository.create.mockReturnValue(undefined);

            jest.spyOn(service, 'verifyOneMatch').mockResolvedValue({ id: matchId } as Match);
            jest.spyOn(service, 'isTeamMember').mockResolvedValue(true as any);
        
            // 예외 발생 검증
            await expect(service.resultMathfinal(userId, matchId, resultMembersDto)).rejects.toThrow(NotFoundException);
        
            // findOneMatch와 isTeamMember 호출 검증
            expect(service.verifyOneMatch).toHaveBeenCalledWith(matchId, expect.anything());
            expect(service.isTeamMember).toHaveBeenCalledTimes(resultMembersDto.results.length);
        });

        it('경기 결과가 없으면 NotFoundException을 발생시켜야 한다', async () => {
            mockMatchResultRepository.count.mockResolvedValue(0); // 경기 결과가 없음을 모킹
            jest.spyOn(service, 'verifyOneMatch').mockResolvedValue({ id: matchId } as Match);
            
            // 예외 발생 검증
            await expect(service.resultMathfinal(userId, matchId, resultMembersDto)).rejects.toThrow(NotFoundException);
        });
    
    
        // 추가적인 예외 시나리오 및 다른 상황에 대한 테스트 케이스를 여기에 구현할 수 있습니다.
    });

    
    describe('findTeamMatches - 팀 전체 경기 일정 조회', () => {
        it('팀 전체 경기 일정 조회 성공 시나리오', async () => {
        const teamId = 1;
        const mockTeamMatches = [
            { id: 1, home_team_id: teamId, away_team_id: 2 },
            { id: 2, home_team_id: 2, away_team_id: teamId },
            // 추가 경기 일정
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
            // 경기 세부 정보를 나타내는 객체들
            { id: 1, match_id: matchId, team_id: 1, goals: 2 },
            { id: 2, match_id: matchId, team_id: 2, goals: 3 },
            // 필요한 경우 추가 정보 포함
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
            
            // jest.spyOn(awsService, 'presignedUrl').mockImplementation(async (token: string) => {
            //     return { id: 1 };
            // });
        
            const result = await service.verifyTeamCreator(userId);

            expect(awsService.presignedUrl).toHaveBeenCalledWith('uuid');

        
            expect(result[0]).toHaveProperty('email', 'user@example.com');
            expect(result[0]).toHaveProperty('imageUrl', 'http://example.com/image.jpg');
        });
    
        it('구단주가 아닐 경우 BadRequestException 발생', async () => {
            const userId = 888; // 구단주가 아닌 userId
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
            const matchId = 999; // 존재하지 않는 경기 ID
            const teamId = 1;
            mockMatchRepository.createQueryBuilder().getOne.mockResolvedValue(undefined);
        
            await expect(service.verifyOneMatch(matchId, teamId)).rejects.toThrow(NotFoundException);
            });
        
            it('요청자 팀이 경기에 참여하지 않은 경우 NotFoundException 발생', async () => {
            const matchId = 1;
            const teamId = 999; // 참여하지 않은 팀 ID
            mockMatchRepository.createQueryBuilder().getOne.mockResolvedValue(undefined);
        
            await expect(service.verifyOneMatch(matchId, teamId)).rejects.toThrow(NotFoundException);
            });

    });

    describe('createTeamStats - 경기 후 팀 스탯 생성', () => {
        it('팀 스탯 생성 성공 시나리오', async () => {
            const mockMatchResult = {
                match_id: 1,
                goals: [{ count: 1 }] // 예시 득점 데이터
            };
            const mockMatch = {
                id: 1,
                home_team_id: 1,
                away_team_id: 2
            }; // 실제 match 객체 모킹
            const mockMatchDetailHome = { goals: [{ count: 2 }] }; // 홈 팀 세부 정보
            const mockMatchDetailAway = { goals: [{ count: 1 }] }; // 어웨이 팀 세부 정보
    
            jest.spyOn(service, 'findOneMatch').mockResolvedValue(mockMatch as any); // 경기 존재 가정
            jest.spyOn(service, 'isMatchDetail')
                .mockResolvedValueOnce(mockMatchDetailHome as any) // 첫 번째 호출에서 홈 팀 정보 반환
                .mockResolvedValueOnce(mockMatchDetailAway as any); // 두 번째 호출에서 어웨이 팀 정보 반환
    
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
            const mockMatchResult = { match_id: 999 }; // 존재하지 않는 경기 ID
    
            jest.spyOn(service, 'findOneMatch').mockResolvedValue(undefined); // 경기 미존재 가정
    
            await expect(service.createTeamStats(mockMatchResult)).rejects.toThrow(NotFoundException);
        });

        // it('경기 결과가 없으면 NotFoundException을 발생시켜야 한다', async () => {
        //     const matchId = 1;
        //     const mockMatchResult = { match_id: matchId };
          
        //     jest.spyOn(service, 'findOneMatch').mockResolvedValue({ id: matchId, home_team_id: 1, away_team_id: 2 } as any);
        //     jest.spyOn(service, 'isMatchDetail').mockResolvedValueOnce(undefined); // 경기 세부 결과가 없음을 모킹
          
        //     await expect(service.createTeamStats(mockMatchResult)).rejects.toThrow(NotFoundException);
        //     expect(service.isMatchDetail).toHaveBeenCalledWith(matchId, 1); // 홈 팀 ID로 호출되었는지 확인
        //   });
    
        // 추가적인 테스트 케이스를 구현할 수 있습니다.
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
                // 여기에 예상되는 match 객체 배열을 반환해야 합니다.
                // 예를 들어:
                { id: 1, date: '2024-02-25', time: '10:00:00', soccer_field_id: 172 },
                // ...더 많은 match 객체
            ]);

            jest.spyOn(mockSoccerFieldRepository, 'findOne').mockResolvedValue({
                // 여기에 예상되는 soccerField 객체를 반환해야 합니다.
                // 예를 들어:
                id: locationId,
                // ...추가 필드
              });

            const availableTimes = await service.findAvailableTimes(date, locationId);

            expect(availableTimes).toEqual(expectedAvailableTimes);
        });
    });

    describe('getTeamOwners - 구단주 전체 명단 조회', () => {
        it('유저 아이디가 아닌 모든 구단주를 조회해야 한다', async () => {
          // 모의 팀 소유주 데이터
          const mockTeamOwners = [
            { id: 2, imageUUID: 'uuid1', name: 'TeamOwner1', creator: { id: 2, email: 'owner1@example.com', name: 'Owner1' } },
            { id: 3, imageUUID: 'uuid2', name: 'TeamOwner2', creator: { id: 3, email: 'owner2@example.com', name: 'Owner2' } },
            // 추가적인 팀 소유주 데이터...
          ];
      
          // teamRepository.find 모킹
          jest.spyOn(mockTeamModelRepository, 'find').mockResolvedValue(mockTeamOwners);
      
          // awsService.presignedUrl 모킹
          jest.spyOn(awsService, 'presignedUrl').mockImplementation(async (uuid) => `https://example.com/${uuid}`);
      
          // 서비스 호출
          const userId = 1; // 테스트에 사용할 사용자 ID
          const result = await service.getTeamOwners(userId);
      
          // 반환값 검증
          expect(result).toEqual(mockTeamOwners.map((owner) => ({
            ...owner,
            imageUrl: `https://example.com/${owner.imageUUID}`,
          })));
      
          // 함수 호출 검증
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
      
          // 모든 teamOwner의 imageUUID에 대해 presignedUrl 함수가 호출되었는지 검증
          mockTeamOwners.forEach((owner) => {
            expect(awsService.presignedUrl).toHaveBeenCalledWith(owner.imageUUID);
          });
        });
      
        it('구단주 명단이 없을 경우 BadRequestException을 발생시킨다', async () => {
          jest.spyOn(teamRepository, 'find').mockResolvedValue([]);
      
          const userId = 1; // 테스트에 사용할 사용자 ID
      
          await expect(service.getTeamOwners(userId)).rejects.toThrow(BadRequestException);
        });
    });

    describe('isMatchDetail - 경기 상세 조회', () => {
        it('경기 상세 정보를 정확히 조회해야 한다', async () => {
          // 모의 경기 상세 정보
          const mockMatchDetail = {
            id: 1,
            match_id: 1,
            team_id: 1,
            // 여기에 추가적인 필드를 포함할 수 있습니다...
          };
      
          // matchResultRepository.findOne 모킹
          jest.spyOn(mockMatchResultRepository, 'findOne').mockResolvedValue(mockMatchDetail);
      
          const matchId = 1; // 테스트에 사용할 매치 ID
          const teamId = 1; // 테스트에 사용할 팀 ID
          const result = await service.isMatchDetail(matchId, teamId);
      
          // 반환값 검증
          expect(result).toEqual(mockMatchDetail);
      
          // 함수 호출 검증
          expect(mockMatchResultRepository.findOne).toHaveBeenCalledWith({
            where: { match_id: matchId, team_id: teamId },
          });
        });
      
        it('경기 상세 정보가 없을 경우 undefined를 반환한다', async () => {
          // matchResultRepository.findOne 모킹하여 undefined를 반환하도록 설정
          jest.spyOn(mockMatchResultRepository, 'findOne').mockResolvedValue(undefined);
      
          const matchId = 1; // 테스트에 사용할 매치 ID
          const teamId = 1; // 테스트에 사용할 팀 ID
          const result = await service.isMatchDetail(matchId, teamId);
      
          // 반환값 검증
          expect(result).toBeUndefined();
        });
    });

    describe('getTeamSchedule - 팀별 일정 조회', () => {
        it('팀 일정 조회 성공 시나리오', async () => {
          const teamId = 1; // 테스트에 사용할 팀 ID
          const userId = 1; // 테스트에 사용할 사용자 ID
          const mockRawResults = [
            // 데이터베이스 쿼리 결과를 모킹합니다.
            { field_name: 'Field A', date: '2024-02-25', image_uuid: 'uuid1', name: 'Team A', opponent_team_id: 2, time: '15:00:00', match_id: 1 },
            // 필요한 경우 추가 결과를 모킹합니다.
          ];
          
          // isTeamMemberByUserId 모킹
          jest.spyOn(service, 'isTeamMemberByUserId').mockResolvedValue(true as any);
          
          // dataSource.query 모킹
          jest.spyOn(mockDataSource, 'query').mockResolvedValue(mockRawResults);
          
          // awsService.presignedUrl 모킹
          jest.spyOn(awsService, 'presignedUrl').mockResolvedValue('http://example.com/image.jpg');
          
          const result = await service.getTeamSchedule(teamId, userId);
          
          // 반환값 검증
          expect(result).toEqual(mockRawResults.map(match => ({ ...match, imageUrl: 'http://example.com/image.jpg' })));
          
          // isTeamMemberByUserId 호출 검증
          expect(service.isTeamMemberByUserId).toHaveBeenCalledWith(teamId, userId);
          
          // dataSource.query 호출 검증
          expect(mockDataSource.query).toHaveBeenCalled();
        });
      
        it('팀의 멤버가 아닐 경우 NotFoundException 발생', async () => {
          const teamId = 1; // 테스트에 사용할 팀 ID
          const userId = 1; // 테스트에 사용할 사용자 ID
          
          // isTeamMemberByUserId 모킹하여 예외를 던지도록 설정
          jest.spyOn(service, 'isTeamMemberByUserId').mockRejectedValue(new NotFoundException('팀의 멤버가 아닙니다.'));
          
          await expect(service.getTeamSchedule(teamId, userId)).rejects.toThrow(NotFoundException);
        });
    });
      
    describe('getMember - 경기별 팀별 멤버 조회', () => {
        it('개인 멤버 정보 조회 성공 시나리오', async () => {
          const userId = 1; // 테스트에 사용할 사용자 ID
          const mockMember = {
            // findOne에서 반환될 예상 멤버 객체
            user: {
              id: userId,
              email: 'user@example.com',
              name: 'Test User',
              profile: {
                id: 1,
                skillLevel: 'Intermediate',
                // 기타 프로필 정보
              },
            },
            team: {
              id: 1,
              // 팀 정보
            },
            playerstats: [
              // 플레이어 통계 정보
            ],
            // 기타 필요한 정보
          };
          
          // memberRepository.findOne 모킹
          jest.spyOn(mockMemberRepository, 'findOne').mockResolvedValue(mockMember);
          
          const result = await service.getMember(userId);
          
          // 반환값 검증
          expect(result).toEqual(mockMember);
          
          // memberRepository.findOne 호출 검증
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
                // 팀 선택항목
              },
              playerstats: {
                // 플레이어 통계 선택항목
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
              // 기타 필요한 선택항목
            },
            where: {
              user: {
                id: userId,
              },
            },
          });
        });
      
        it('멤버 정보가 없을 경우 BadRequestException 발생', async () => {
          const userId = 999; // 존재하지 않는 사용자 ID
          
          // memberRepository.findOne 모킹하여 null 반환
          jest.spyOn(mockMemberRepository, 'findOne').mockResolvedValue(null);
          
          await expect(service.getMember(userId)).rejects.toThrow(BadRequestException);
        });
    });


    describe('getTeamMembers- 경기별 팀별 멤버 조회', () => {
        it('경기별 팀별 멤버 조회 성공 시나리오', async () => {
          const matchId = 1; // 테스트에 사용할 경기 ID
          const teamId = 1; // 테스트에 사용할 팀 ID
          const mockMembers = [
            // find에서 반환될 예상 멤버 객체 배열
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
            // 추가 멤버 객체
          ];
          
          // memberRepository.find 모킹
          jest.spyOn(mockMemberRepository, 'find').mockResolvedValue(mockMembers);
          
          const result = await service.getTeamMembers(matchId, teamId);
          
          // 반환값 검증
          expect(result).toEqual(mockMembers);
          
          // memberRepository.find 호출 검증
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
      
        // 추가적인 테스트 케이스는 여러분의 필요에 따라 구현하실 수 있습니다.
    });
    
    describe('isTeamMemberByUserId - 팀 특정 멤버 조회', () => {
        it('팀의 멤버일 경우 해당 멤버 정보를 반환해야 한다', async () => {
          const teamId = 1; // 테스트에 사용할 팀 ID
          const userId = 1; // 테스트에 사용할 사용자 ID
          const mockMember = {
            id: 1,
            team_id: teamId,
            user_id: userId,
            // 추가적인 멤버 정보
          };
      
          // memberRepository.createQueryBuilder 모킹
          jest.spyOn(mockMemberRepository, 'createQueryBuilder').mockReturnValue({
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockResolvedValue(mockMember),
          });
      
          const result = await service.isTeamMemberByUserId(teamId, userId);
      
          // 반환값 검증
          expect(result).toEqual(mockMember);
      
          // 쿼리 빌더 사용 검증
          expect(mockMemberRepository.createQueryBuilder).toHaveBeenCalled();
        });
      
        it('팀의 멤버가 아닐 경우 NotFoundException을 던져야 한다', async () => {
          const teamId = 2;
          const userId = 2;
      
          // memberRepository.createQueryBuilder 모킹하여 멤버가 없음을 시뮬레이션
          jest.spyOn(mockMemberRepository, 'createQueryBuilder').mockReturnValue({
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockResolvedValue(undefined),
          });
      
          await expect(service.isTeamMemberByUserId(teamId, userId)).rejects.toThrow(NotFoundException);
        });
      
        // 추가적인 테스트 케이스는 여러분의 필요에 따라 구현하실 수 있습니다.
    });

    describe('isTeamMember - 팀멤버 검증', () => {
      
        it('멤버가 존재할 경우 멤버 정보를 반환해야 한다', async () => {
          const teamId = 1;
          const memberId = 1;
          const mockMember = { id: memberId, team_id: teamId }; // 예시 멤버 객체
      
          mockMemberRepository.createQueryBuilder().getOne.mockResolvedValue(mockMember);
      
          const result = await service.isTeamMember(teamId, memberId);
          expect(result).toEqual(mockMember);
        });
      
        it('멤버가 존재하지 않을 경우 NotFoundException을 던져야 한다', async () => {
          const teamId = 1;
          const memberId = 999; // 존재하지 않는 멤버 ID
      
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
          const mockMatch = { id: 1, date, time }; // 이미 예약된 경기 예시
      
          mockMatchRepository.findOne.mockResolvedValue(mockMatch);
      
          await expect(service.verifyReservedMatch(date, time)).rejects.toThrow(BadRequestException);
        });
      
        // 필요한 경우 더 많은 테스트 케이스를 추가할 수 있습니다.
    });
    
    describe('matchResultCount - 경기결과 카운트', () => {
      
        it('경기 결과가 없을 때, count가 0이고 team이 빈 객체이어야 한다', async () => {
          const matchId = 1; // 테스트를 위한 임의의 matchId
          mockMatchResultRepository.count.mockResolvedValue(0); // count 메서드 모킹
      
          const result = await service.matchResultCount(matchId);
      
          expect(result.count).toBe(0);
          expect(result.team).toEqual({});
          expect(mockMatchResultRepository.count).toHaveBeenCalledWith({ where: { match_id: matchId } });
          expect(mockMatchResultRepository.findOne).not.toHaveBeenCalled();
        });
      
        it('경기 결과가 있을 때, count가 1 이상이고 team에 정보가 포함되어야 한다', async () => {
          const matchId = 1; // 테스트를 위한 임의의 matchId
          const mockTeam = { id: 1, name: 'Test Team' }; // findOne 메서드 반환을 위한 모킹 객체
          mockMatchResultRepository.count.mockResolvedValue(1); // count 메서드 모킹
          mockMatchResultRepository.findOne.mockResolvedValue(mockTeam); // findOne 메서드 모킹
      
          const result = await service.matchResultCount(matchId);
      
          expect(result.count).toBeGreaterThan(0);
          expect(result.team).toEqual(mockTeam);
          expect(mockMatchResultRepository.count).toHaveBeenCalledWith({ where: { match_id: matchId } });
          expect(mockMatchResultRepository.findOne).toHaveBeenCalledWith({ where: { match_id: matchId } });
        });
      
        // 추가적인 시나리오에 대한 테스트 케이스를 구현할 수 있습니다.
    });

    describe('getMatchResultByMatchId - 경기 결과 조회 (경기번호로)', () => {

        it('경기 결과가 존재할 경우, 올바른 형식으로 결과를 반환해야 한다', async () => {
          const matchId = 1;
          const teamId = 1;
          const mockMatchResult = [
            // 경기 결과 모킹 데이터
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
      
          // 결과 형식 검증
          expect(result).toHaveProperty('date');
          expect(result).toHaveProperty('time');

          // `home` 팀의 결과가 있는지 확인
          if (result.hasOwnProperty('home')) {
              expect((result as any).home.counted_goals).toEqual(3);
              expect((result as any).home.counted_yellow_cards).toEqual(2);
              expect((result as any).home.counted_red_cards).toEqual(1);
              expect((result as any).home.counted_saves).toEqual(3);
          }
          // 추가적으로, 결과가 올바르게 변형되어 있는지 검증하는 로직을 추가할 수 있습니다.
      
          expect(mockMatchResultRepository.find).toHaveBeenCalledWith(expect.any(Object));
          expect(mockMatchRepository.findOne).toHaveBeenCalledWith({ where: { id: matchId } });
        });

        it('경기 결과에 homeTeamId와 awayTeamId가 정확하게 매핑되어야 한다', async () => {

          // 반환 타입 정의
          interface MatchResult {
            home?: MatchTeamResult; // home 팀 결과, 존재하지 않을 수도 있으므로 optional
            away?: MatchTeamResult; // away 팀 결과, 존재하지 않을 수도 있으므로 optional
            date: string;
            time: string;
          }

          interface MatchTeamResult {
            team_id: number;
            counted_goals: number;
            // ...기타 필요한 속성들
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
  
          // // service.getMatchResultByMatchId를 호출하여 결과를 받아온다.
          // const resultHome = await service.getMatchResultByMatchId(matchId, homeTeamId);
          // const resultAway = await service.getMatchResultByMatchId(matchId, awayTeamId);
  
          // // 결과 검증: homeTeamId와 awayTeamId가 기대하는 값으로 설정되어 있는지 확인한다.
          // expect(resultHome[0].home_team_id).toEqual(homeTeamId);
          // expect(resultHome[0].away_team_id).toEqual(awayTeamId);
          // expect(resultAway[0].home_team_id).toEqual(awayTeamId);
          // expect(resultAway[0].away_team_id).toEqual(homeTeamId);
      });
  
      it('경기 결과의 goals와 saves를 정확하게 계산하여 반영해야 한다', async () => {

          // 반환 타입 정의
          interface MatchResult {
            home?: MatchTeamResult; // home 팀 결과, 존재하지 않을 수도 있으므로 optional
            away?: MatchTeamResult; // away 팀 결과, 존재하지 않을 수도 있으므로 optional
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
            // ...기타 필요한 속성들
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

          // 함수 실행
          const result = await service.getMatchResultByMatchId(matchId, homeTeamId) as MatchResult;

          // 결과 검증
          expect(result.home?.counted_goals).toBe(2); // 홈 팀의 총 골 수 검증
          expect(result.home?.counted_saves).toBe(1); // 홈 팀의 총 세이브 수 검증
          expect(result.away?.counted_goals).toBe(1); // 어웨이 팀의 총 골 수 검증
          expect(result.away?.counted_saves).toBe(3); // 어웨이 팀의 총 세이브 수 검증
  
          // // service.getMatchResultExist(matchId)를 호출하여 결과를 받아온다.
          // const resultHome = await service.getMatchResultByMatchId(matchId, homeTeamId) as MatchResult;
          // const resultAway = await service.getMatchResultByMatchId(matchId, awayTeamId) as MatchResult;
  
          // // 결과 검증: goals와 saves의 합이 정확하게 반영되어 있는지 확인한다.
          // expect(resultHome.home?.counted_goals).toEqual(2); // 첫 번째 팀의 총 골 수
          // expect(resultHome.home?.counted_saves).toEqual(1); // 첫 번째 팀의 총 세이브 수
          // expect(resultAway.away?.counted_goals).toEqual(1); // 두 번째 팀의 총 골 수
          // expect(resultAway.away?.counted_saves).toEqual(3); // 두 번째 팀의 총 세이브 수
      });
      
      it('경기 결과가 존재하지 않을 경우, NotFoundException을 발생시켜야 한다', async () => {
        const matchId = 2;
        const teamId = 1;
    
        mockMatchResultRepository.find.mockResolvedValue(undefined);
        mockMatchRepository.findOne.mockResolvedValue(undefined);
    
        await expect(service.getMatchResultByMatchId(matchId, teamId)).rejects.toThrow(NotFoundException);
    
        //expect(mockMatchResultRepository.find).toHaveBeenCalledWith(expect.any(Object));
        expect(mockMatchResultRepository.find).toHaveBeenCalledWith({
          where: { match_id: matchId },
          relations: { match: true },
          select: expect.any(Object),
        });
        expect(mockMatchRepository.findOne).toHaveBeenCalledWith({ where: { id: matchId } });
      });
      
        // 추가적인 테스트 케이스를 여기에 구현할 수 있습니다.
    });
      
    describe('getMatchResultExist', () => {
      
        it('경기 결과가 존재할 경우, 해당 결과를 반환해야 한다', async () => {
          const matchId = 1;
          const mockResult = { id: matchId, goals: 2 }; // 예시 경기 결과 데이터
          mockMatchResultRepository.findOne.mockResolvedValue(mockResult);
      
          const result = await service.getMatchResultExist(matchId);
      
          expect(result).toEqual(mockResult);
          expect(mockMatchResultRepository.findOne).toHaveBeenCalledWith({
            where: { match_id: matchId },
          });
        });
      
        it('경기 결과가 존재하지 않을 경우, NotFoundException을 발생시켜야 한다', async () => {
          const matchId = 999; // 존재하지 않는 경기 ID
          mockMatchResultRepository.findOne.mockResolvedValue(undefined);
      
          await expect(service.getMatchResultExist(matchId)).rejects.toThrow(NotFoundException);
          expect(mockMatchResultRepository.findOne).toHaveBeenCalledWith({
            where: { match_id: matchId },
          });
        });
      
        // 가능한 모든 테스트를 적용한다는 부분에서, 여러 다양한 상황(예: 데이터베이스 연결 오류 등)에 대한 테스트도 고려할 수 있지만,
        // 실제 구현 상황과 사용하는 테스트 프레임워크의 기능에 따라 추가적인 테스트 케이스를 구현할 수 있습니다.
    });

});
    

