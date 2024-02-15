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
import { createRequestDto } from './dtos/create-request.dto';
import { Repository,DataSource } from 'typeorm';

  // DataSource에 대한 모의 객체 생성
  const mockDataSource = {
    // 필요한 메서드 모의 구현
  };

  // 모의 객체 및 서비스 정의
    const mockRepository = () => ({
        findOne: jest.fn(),
        save: jest.fn(),
    });

describe('MatchService', () => {
  let service: MatchService;
  let emailService: EmailService;
  let matchRepository: ReturnType<typeof mockRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchService,
        EmailService,
        AuthService,
        JwtService,
        ConfigService,
        AwsService,
        { provide: getRepositoryToken(Match), useValue: {} },
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: getRepositoryToken(Member), useValue: {} },
        { provide: getRepositoryToken(TeamModel), useValue: {} },
        { provide: getRepositoryToken(MatchResult), useValue: {} },
        { provide: getRepositoryToken(PlayerStats), useValue: {} },
        { provide: getRepositoryToken(TeamStats), useValue: {} },
        { provide: getRepositoryToken(SoccerField), useValue: {} },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<MatchService>(MatchService);
    emailService = module.get<EmailService>(EmailService);
  });

//   it('should send a match creation request email', async () => {
//     // Mock data
//     const userId = 1;
//     const createRequest: createRequestDto = {
//       date: '2024-02-25',
//       time: '18:00:00',
//       homeTeamId: 1,
//       awayTeamId: 2,
//       fieldId: 5,
//     };
//     const token = 'some-token';
//     const emailRequest = {
//       email: 'example@example.com',
//       subject: '경기 일정 생성 요청',
//       clubName: '팀 B',
//       originalSchedule: '2024-02-25 18:00:00',
//       newSchedule: '2024-02-25 18:00:00',
//       reason: '경기 제안',
//       homeTeamId: 1,
//       awayTeamId: 2,
//       fieldId: 5,
//       senderName: '구단주',
//       url: 'https://example.com/api/match/book/accept',
//       chk: 'create',
//       token: 'some-token',
//     };

//     // Mock 함수 설정
//     // jest.spyOn(service.authService, 'generateAccessEmailToken').mockReturnValue(token);
//     // jest.spyOn(service, 'verifyTeamCreator').mockResolvedValue([{ name: '구단주' }]);
//     // jest.spyOn(service, 'getTeamInfo').mockResolvedValue({ creator: { email: 'example@example.com' } });
//     // jest.spyOn(emailService, 'reqMatchEmail').mockResolvedValue(true);

//     // 테스트 수행
//     const result = await service.requestCreMatch(userId, createRequest);

//     // 결과 검증
//     expect(result).toBeTruthy();
//     // expect(service.authService.generateAccessEmailToken).toHaveBeenCalledWith(userId);
//     // expect(service.verifyTeamCreator).toHaveBeenCalledWith(userId);
//     // expect(service.getTeamInfo).toHaveBeenCalledWith(createRequest.awayTeamId);
//     // expect(emailService.reqMatchEmail).toHaveBeenCalledWith(emailRequest);
//   });

    describe('경기 일정 조회 findOneMatch', () => {
        it('should return a match for a given id', async () => {
          const mockMatch = {
            id: 1,
            homeTeamId: 1,
            awayTeamId: 2,
            date: "2024-02-25",
            time: "18:00:00",
          };
    
          matchRepository.findOne.mockResolvedValue(mockMatch);
    
          const matchId = 1;
          const result = await service.findOneMatch(matchId);
          
          expect(result).toBeDefined();
          expect(result).toEqual(mockMatch);
          expect(matchRepository.findOne).toHaveBeenCalledWith({
            where: { id: matchId },
          });
        });
    
        it('should throw a NotFoundException if no match is found for a given id', async () => {
          matchRepository.findOne.mockResolvedValue(undefined);
    
          const matchId = 999; // 존재하지 않는 경기 ID
          
          await expect(service.findOneMatch(matchId)).rejects.toThrow(NotFoundException);
        });
      });


});
