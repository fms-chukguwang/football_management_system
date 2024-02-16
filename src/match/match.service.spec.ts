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
import { Repository } from 'typeorm';

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
import { DataSource } from 'typeorm';

jest.mock('../email/email.service');
jest.mock('../auth/auth.service');
jest.mock('@nestjs/jwt');
jest.mock('@nestjs/config');
jest.mock('../aws/aws.service');

describe('MatchService', () => {
    let service: MatchService;
    let emailService: EmailService;
    let authService: AuthService;
    let jwtService: JwtService;
    let userRepository: Repository<User>;
    let teamRepository: Repository<TeamModel>;
    let matchRepository: Repository<Match>;

    const mockMatchRepository = {
        findOne: jest.fn()
    };
    const mockUserRepository = {};
    const mockMemberRepository = {};
    const mockTeamModelRepository = {
        findOne: jest.fn().mockResolvedValue({
            id: 2,
            name: '상대 팀',
            creator: {
                email: 'away@example.com'
            },
            // 필요한 추가 속성
        })
    };
    const mockMatchResultRepository = {};
    const mockPlayerStatsRepository = {};
    const mockTeamStatsRepository = {};
    const mockSoccerFieldRepository = {};

    beforeEach(async () => {

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MatchService,
                EmailService,
                AuthService,
                JwtService,
                ConfigService,
                AwsService,
                { provide: getRepositoryToken(Match), useValue: mockMatchRepository },
                { provide: getRepositoryToken(User), useValue: mockUserRepository },
                { provide: getRepositoryToken(Member), useValue: mockMemberRepository },
                { provide: getRepositoryToken(TeamModel), useValue: mockTeamModelRepository },
                { provide: getRepositoryToken(MatchResult), useValue: mockMatchResultRepository },
                { provide: getRepositoryToken(PlayerStats), useValue: mockPlayerStatsRepository },
                { provide: getRepositoryToken(TeamStats), useValue: mockTeamStatsRepository },
                { provide: getRepositoryToken(SoccerField), useValue: mockSoccerFieldRepository },
                // 나머지 엔티티에 대한 모의 리포지토리 제공
                { provide: DataSource, useValue: {}},
            ],
        }).compile();

        service = module.get<MatchService>(MatchService);
        emailService = module.get<EmailService>(EmailService);
        authService = module.get<AuthService>(AuthService);
        jwtService = module.get<JwtService>(JwtService); // JwtService 인스턴스 가져오기
        userRepository = module.get<Repository<User>>(getRepositoryToken(User)); // UserRepository 인스턴스 가져오기
        teamRepository = module.get<Repository<TeamModel>>(getRepositoryToken(TeamModel)); // TeamRepository 인스턴스 가져오기
        matchRepository = module.get<Repository<Match>>(getRepositoryToken(Match)); // MatchRepository 인스턴스 가져오기

        // 모의 메서드 구현
        (emailService.reqMatchEmail as jest.Mock).mockResolvedValue(true);
        (authService.generateAccessEmailToken as jest.Mock).mockReturnValue('some-token');

        jest.clearAllMocks(); // 모든 모의 호출을 초기화
    });

    describe('requestCreMatch - 경기 생성 이메일 요청(상대팀 구단주에게)', () => {

        let createRequestDto;

        beforeEach(async () => {
            //mockMatchRepository.findOne = jest.fn().mockResolvedValue(undefined);

            // 필요한 메서드의 모의 구현
            jest.spyOn(service, 'verifyReservedMatch').mockResolvedValue(undefined);
            jest.spyOn(service, 'verifyTeamCreator').mockResolvedValue([
                { name: '구단주 이름' } as any
            ] );
            // jest.spyOn(service, 'getTeamInfo').mockResolvedValue({
            //     creator: { email: 'away@example.com' },
            //     name: '상대 팀'
            // });
    
            // 메서드 호출 및 결과 검증
            const userId = 1;
            createRequestDto = {
                date: '2024-02-25',
                time: '18:00:00',
                homeTeamId: 1,
                awayTeamId: 2,
                fieldId: 173,
            };

        });

        it('should successfully make the request', async () => {
            const userId = 1;
            const result = await service.requestCreMatch(userId, createRequestDto);
            expect(result).toBeTruthy();
        });
    
        it('should call emailService.reqMatchEmail with the correct parameters', async () => {
            const userId = 1;
            await service.requestCreMatch(userId, createRequestDto);
            expect(emailService.reqMatchEmail).toHaveBeenCalledWith(expect.any(Object));
        });
    
        it('should call emailService.reqMatchEmail exactly once', async () => {
            const userId = 1;
            await service.requestCreMatch(userId, createRequestDto);
            expect(emailService.reqMatchEmail).toHaveBeenCalledTimes(1);
        });
    
        it('should generate an access email token for the user', async () => {
            const userId = 1;
            await service.requestCreMatch(userId, createRequestDto);
            expect(authService.generateAccessEmailToken).toHaveBeenCalledWith(userId);
        });
    
        // 추가적인 에러 케이스에 대한 테스트도 구현할 수 있습니다.
        // 예를 들어, verifyReservedMatch가 예외를 던지는 경우:
        it('should throw an exception if the match time is already reserved', async () => {
            jest.spyOn(service, 'verifyReservedMatch').mockRejectedValue(new BadRequestException('이미 예약된 경기 일정 입니다.'));
            const userId = 1;
            await expect(service.requestCreMatch(userId, createRequestDto)).rejects.toThrow(BadRequestException);
        });
    });

    describe('findOneMatch - 경기 일정 조회', () => {

        it('should return a match for a given id', async () => {
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

        it('should throw a NotFoundException if no match is found for a given id', async () => {
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

            // 모의 함수 구현
            jest.spyOn(jwtService, 'verify').mockImplementation(async (token: string) => {
                const payload = await jwtService.signAsync({ id: 1 });
                return payload;
            });
              


            // jest.spyOn(userRepository, 'findOne').mockResolvedValue({ id: 1, name: 'Test User' });
            // jest.spyOn(teamRepository, 'findOne').mockResolvedValue({ id: 1, name: 'Test Team', creator: { email: 'test@example.com' } });
            // jest.spyOn(matchRepository, 'create').mockImplementation(match => match);
            // jest.spyOn(matchRepository, 'save').mockImplementation(match => Promise.resolve({ id: 99, ...match }));
        });
    
        it('JWT 인증 성공 시 경기 생성', async () => {
            const result = await service.createMatch(createMatchDto);
    
            expect(jwtService.verify).toHaveBeenCalledWith(createMatchDto.token, expect.any(Object));
            expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
            expect(teamRepository.findOne).toHaveBeenCalled();
            expect(matchRepository.create).toHaveBeenCalledWith(expect.any(Object));
            expect(matchRepository.save).toHaveBeenCalled();
            expect(result).toEqual(expect.objectContaining({
                id: expect.any(Number),
                date: createMatchDto.date,
                time: createMatchDto.time,
                home_team_id: parseInt(createMatchDto.homeTeamId),
                away_team_id: parseInt(createMatchDto.awayTeamId),
                soccer_field_id: parseInt(createMatchDto.fieldId),
            }));
        });
    
        it('JWT 인증 실패 시 UnauthorizedException 발생', async () => {
            //jest.spyOn(jwtService, 'verify').mockRejectedValue(new UnauthorizedException());
    
            await expect(service.createMatch(createMatchDto)).rejects.toThrow(UnauthorizedException);
        });
    
        // 추가적인 테스트 케이스 구현...
    });
    

    // 필요한 경우 추가 테스트 케이스 작성
});
