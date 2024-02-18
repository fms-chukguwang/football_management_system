import {
    Body,
    Controller,
    Post,
    UseGuards,
    Request,
    HttpStatus,
    Put,
    Param,
    Get,
    Delete,
    Query,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MatchController } from './match.controller';
import { MatchService } from './match.service';
import { createRequestDto } from './dtos/create-request.dto';
import { createMatchDto } from './dtos/create-match.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { updateMatchDto } from './dtos/update-match.dto';
import { deleteMatchDto } from './dtos/delete-match.dto';
import { deleteRequestDto } from './dtos/delete-request.dto';
import { updateRequestDto } from './dtos/update-request.dto';
import { createMatchResultDto } from './dtos/result-match.dto';
import { createPlayerStatsDto } from './dtos/player-stats.dto';
import { ResultMembersDto } from './dtos/result-final.dto';
import { SoccerField } from './entities/soccer-field.entity';


describe('MatchController', () => {
  let controller: MatchController;
  let service: MatchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MatchController],
      providers: [
        {
          provide: MatchService,
          useValue: {
            requestCreMatch: jest.fn(() => Promise.resolve({ success: true })),
            findAllSoccerField: jest.fn(() => Promise.resolve([{ id: 1, name: 'field name' }])),
            requestUptMatch: jest.fn(() => Promise.resolve({ statusCode: HttpStatus.OK, success: true })),
            updateMatch: jest.fn(() => Promise.resolve('경기 일정 수정 되었습니다.')),
            requestDelMatch: jest.fn(),
            deleteMatch: jest.fn(),
            getMembersMatchResult: jest.fn(() => Promise.resolve([          
              { id: 1, name: 'Player 1' },
              { id: 2, name: 'Player 2' }
            ])),
            getMembers: jest.fn(() => Promise.resolve([
                { id: 1, name: 'Player 1' },
                { id: 2, name: 'Player 2' },
            ])), 
            getTeamMatchResult: jest.fn(() => Promise.resolve({
              score: '2:1',
              winner: 'Team A',
            })),
            resultMatchCreate: jest.fn(() =>
            Promise.resolve({
              result: 'Match result saved successfully',
            })),
            resultMathfinal: jest.fn().mockResolvedValue(undefined),
            getTeamMembers: jest.fn(() =>
            Promise.resolve([
              { memberId: 1, name: 'Player 1' },
              { memberId: 2, name: 'Player 2' },
            ])),
            getTeamSchedule: jest.fn(() =>
            Promise.resolve([
              { matchId: 1, date: '2024-01-01', opponent: 'Team B' },
              { matchId: 2, date: '2024-02-01', opponent: 'Team C' },
            ])),
            findTeamMatches: jest.fn(() =>
            Promise.resolve([
              { matchId: 1, date: '2024-03-01', opponent: 'Team A' },
              { matchId: 2, date: '2024-04-01', opponent: 'Team B' },
            ])),
            getTeamOwners: jest.fn(() =>
            Promise.resolve([
              { ownerId: 1, name: 'Owner 1' },
              { ownerId: 2, name: 'Owner 2' },
            ])),
            getMember: jest.fn(() =>
            Promise.resolve({
              userId: 1,
              name: 'John Doe',
              email: 'john@example.com',
            })),
            findAvailableTimes: jest.fn(() =>
            Promise.resolve([
              { timeSlot: '09:00-10:00', available: true },
              { timeSlot: '10:00-11:00', available: false },
            ])),
            findMatchDetail: jest.fn(() =>
            Promise.resolve({
              matchId: 1,
              date: '2024-05-20',
              location: 'Stadium A',
              teams: ['Team A', 'Team B']
            })),
            findOneMatch: jest.fn(() =>
            Promise.resolve({
              matchId: 1,
              teamA: 'Team A',
              teamB: 'Team B',
              matchDate: '2024-06-01'
            })),
            getMatchResultByMatchId: jest.fn(() =>
            Promise.resolve({
              matchId: 1,
              teamId: 1,
              result: 'Win',
            })),
            getMatchResultExist: jest.fn(() =>
            Promise.resolve(true) // 가정: 결과가 존재한다고 가정
          ),
          },
          
        },
      ],
    }).compile();

    controller = module.get<MatchController>(MatchController);
    service = module.get<MatchService>(MatchService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('requestCreMatch', () => {
    it('should create a match request', async () => {
      const mockRequest = {
        user: { id: 1 },
      };
      const mockCreateRequestDto: createRequestDto = {
        // ...dto properties
        date: '2024-02-25',
        time: '18:00:00',
        homeTeamId: 1,
        awayTeamId: 2,
        fieldId: 173,
      };

      const result = await controller.requestCreMatch(mockRequest as any, mockCreateRequestDto);

      expect(result).toEqual({
        statusCode: 200,
        success: true,
      });
      expect(service.requestCreMatch).toHaveBeenCalledWith(mockRequest.user.id, mockCreateRequestDto);
    });
  });

  describe('createMatch', () => {
    it('should create a match', async () => {
      const dto = new createMatchDto(); // DTO의 예시 인스턴스
      service.createMatch = jest.fn().mockResolvedValue('경기 일정 생성 되었습니다.');
      
      const result = await controller.createMatch(dto);
      
      expect(result).toEqual('경기 일정 생성 되었습니다.');
      expect(service.createMatch).toHaveBeenCalledWith(dto);
    });
  });

  describe('verifyTeamCreator', () => {
    it('should verify team creator', async () => {
      const userId = 1; // 예시 사용자 ID
      const mockData = { success: true, data: {} }; // 예시 응답 데이터
      service.verifyTeamCreator = jest.fn().mockResolvedValue(mockData.data);
      
      const req = { user: { id: userId } }; // 예시 요청 객체
      const result = await controller.verifyTeamCreator(req as any);
      
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        success: true,
        data: mockData.data,
      });
      expect(service.verifyTeamCreator).toHaveBeenCalledWith(userId);
    });
  });

  describe('findAllSoccerField', () => {
    it('should return a list of soccer fields', async () => {
      const result = await controller.findAllSoccerField();
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        success: true,
        data: [{ id: 1, name: 'field name' }],
      });
      expect(service.findAllSoccerField).toHaveBeenCalled();
    });
  });

  describe('requestUptMatch', () => {
    it('should update a match request', async () => {
      const req = { user: { id: 1 } }; // Request 객체 모킹
      const matchId = 1;
      const updateRequestDto = new updateMatchDto(); // UpdateMatchDto의 인스턴스 생성
      updateRequestDto.date = "2024-01-29"; // 예약 변경일자
      updateRequestDto.time = "14:00:00"; // 예약 변경시간
      updateRequestDto.reason = "기상 악화로 인한 일정 변경"; // 사유

      // 업데이트를 요청하는 로직
      const result = await controller.requestUptMatch(req, matchId, updateRequestDto);

      // 성공적으로 업데이트 요청이 처리되었는지 검증
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        success: true,
      });
      
      // service의 requestUptMatch 메소드가 호출되었는지 검증
      expect(service.requestUptMatch).toHaveBeenCalledWith(req.user.id, matchId, updateRequestDto);
    });
  });

  describe('updateMatch', () => {
    it('should return confirmation message after updating the match', async () => {
      const matchId = 1;
      const updatematchDto = new updateMatchDto();
      updatematchDto.date = "2024-01-29";
      updatematchDto.time = "14:00:00";
      updatematchDto.reason = "기상 악화로 인한 일정 변경";

      const response = await controller.updateMatch(matchId, updatematchDto);

      expect(response).toEqual('경기 일정 수정 되었습니다.');
      expect(service.updateMatch).toHaveBeenCalledWith(matchId, updatematchDto);
    });
  });

  describe('requestDelMatch', () => {
    it('should return a success message after deleting the match', async () => {
      const req = { user: { id: 1 } }; // Request 객체 모킹
      const matchId = 1;
      const deleterequestDto = new deleteRequestDto();
      deleterequestDto.reason = "악천우 예상으로 일정 취소"; // 사유 설정

      const result = await controller.requestDelMatch(req, matchId, deleterequestDto);

      // 성공적으로 삭제 요청이 처리되었는지 검증
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        success: true,
      });
      
      // service의 requestDelMatch 메소드가 호출되었는지 검증
      expect(service.requestDelMatch).toHaveBeenCalledWith(req.user.id, matchId, deleterequestDto);
    });
  });

  describe('deleteMatch', () => {
    it('should return confirmation message after deleting the match', async () => {
      const matchId = 1;
      const deletematchDto = new deleteMatchDto();
      deletematchDto.reason = "악천우 예상으로 인한 일정 취소";
      deletematchDto.token = "some-token-value"; // 가정된 토큰 값

      const result = await controller.deleteMatch(matchId, deletematchDto);

      expect(result).toEqual('경기 일정 삭제 되었습니다.');
      expect(service.deleteMatch).toHaveBeenCalledWith(deletematchDto, matchId);
    });
  });

  describe('getMembersMatchResult', () => {
    it('should return a list of team members for a given match', async () => {
      const matchId = 1;
      const teamId = 1;

      const result = await controller.getMembersMatchResult({ user: { id: 1 } }, matchId, teamId);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        success: true,
        data: [
          { id: 1, name: 'Player 1' },
          { id: 2, name: 'Player 2' },
        ],
      });
      expect(service.getMembersMatchResult).toHaveBeenCalledWith(matchId, teamId);
    });
  });

  describe('getMembers', () => {
    it('should return a list of team members', async () => {
      const teamId = 1;

      const result = await controller.getMembers(teamId);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        success: true,
        data: [
          { id: 1, name: 'Player 1' },
          { id: 2, name: 'Player 2' },
        ],
      });
      
      // service의 getMembers 메소드가 호출되었는지 검증
      expect(service.getMembers).toHaveBeenCalledWith(teamId);
    });
  });

  describe('getTeamMatchResult', () => {
    it('should return match result for a team', async () => {
      const matchId = 1;
      const teamId = 1;

      const result = await controller.getTeamMatchResult({ user: { id: 1 } }, matchId, teamId);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        success: true,
        data: {
          score: '2:1',
          winner: 'Team A',
        },
      });
      
      // service의 getTeamMatchResult 메소드가 호출되었는지 검증
      expect(service.getTeamMatchResult).toHaveBeenCalledWith(matchId, teamId);
    });
  });

  describe('resultMatchCreate', () => {
    it('should return success message after creating match result', async () => {
      const req = { user: { id: 1 } }; // Request 객체 모킹
      const matchId = 1;
      const creatematchResultDto = new createMatchResultDto();
      creatematchResultDto.cornerKick = 5;
      creatematchResultDto.substitions = [{ inPlayerId: 2, outPlayerId: 1 }];
      creatematchResultDto.passes = 150;
      creatematchResultDto.penaltyKick = 0;
      creatematchResultDto.freeKick = 6;
      // createMatchResultDto에 필요한 속성을 설정합니다.
      // 예: createMatchResultDto.score = "2:1";

      const result = await controller.resultMatchCreate(req, matchId, creatematchResultDto);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        success: true,
        data: {
          result: 'Match result saved successfully',
        },
      });
      
      // service의 resultMatchCreate 메소드가 호출되었는지 검증
      expect(service.resultMatchCreate).toHaveBeenCalledWith(req.user.id, matchId, creatematchResultDto);
    });
  });
  
  describe('resultMathfinal', () => {
    it('should return success message after saving match final results for members', async () => {
      const req = { user: { id: 1 } }; // Request 객체 모킹
      const matchId = 1;
      const resultMemberDto = new ResultMembersDto();
      resultMemberDto.results = [
        { memberId: 1, assists: 2, goals: 0, yellowCards: 0, redCards: 0, save: 0 }
      ];

      const result = await controller.resultMathfinal(req, matchId, resultMemberDto);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        success: true,
      });
      
      // service의 resultMathfinal 메소드가 호출되었는지 검증
      expect(service.resultMathfinal).toHaveBeenCalledWith(req.user.id, matchId, resultMemberDto);
    });
  });

  describe('getTeamMembers', () => {
    it('should return a list of team members for a given match and team', async () => {
      const matchId = 1;
      const teamId = 1;

      const result = await controller.getTeamMembers(matchId, teamId);

      expect(result).toEqual([
        { memberId: 1, name: 'Player 1' },
        { memberId: 2, name: 'Player 2' },
      ]);
      
      // service의 getTeamMembers 메소드가 호출되었는지 검증
      expect(service.getTeamMembers).toHaveBeenCalledWith(matchId, teamId);
    });
  });

  describe('getTeamSchedule', () => {
    it('should return team schedule for a given team', async () => {
      const req = { user: { id: 1 } }; // Request 객체 모킹
      const teamId = 1;

      const result = await controller.getTeamSchedule(req, teamId);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        success: true,
        data: [
          { matchId: 1, date: '2024-01-01', opponent: 'Team B' },
          { matchId: 2, date: '2024-02-01', opponent: 'Team C' },
        ],
      });
      
      // service의 getTeamSchedule 메소드가 호출되었는지 검증
      expect(service.getTeamSchedule).toHaveBeenCalledWith(teamId, req.user.id);
    });
  });

  describe('findTeamMatches', () => {
    it('should return team matches for a given team', async () => {
      const teamId = 1;

      const result = await controller.findTeamMatches(teamId);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        success: true,
        data: [
          { matchId: 1, date: '2024-03-01', opponent: 'Team A' },
          { matchId: 2, date: '2024-04-01', opponent: 'Team B' },
        ],
      });
      
      // service의 findTeamMatches 메소드가 호출되었는지 검증
      expect(service.findTeamMatches).toHaveBeenCalledWith(teamId);
    });
  });

  describe('getTeamOwners', () => {
    it('should return a list of team owners', async () => {
      const req = { user: { id: 1 } }; // Request 객체 모킹

      const result = await controller.getTeamOwners(req);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        success: true,
        data: [
          { ownerId: 1, name: 'Owner 1' },
          { ownerId: 2, name: 'Owner 2' },
        ],
      });
      
      // service의 getTeamOwners 메소드가 호출되었는지 검증
      expect(service.getTeamOwners).toHaveBeenCalledWith(req.user.id);
    });
  });

  describe('getMember', () => {
    it('should return member information for the logged-in user', async () => {
      const req = { user: { id: 1 } }; // Request 객체 모킹

      const result = await controller.getMember(req);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        success: true,
        data: {
          userId: 1,
          name: 'John Doe',
          email: 'john@example.com',
        },
      });
      
      // service의 getMember 메소드가 호출되었는지 검증
      expect(service.getMember).toHaveBeenCalledWith(req.user.id);
    });
  });

  describe('getMemberDetail', () => {
    it('should return detailed information for a specific member', async () => {
      const req = { user: { id: 1 } }; // Request 객체 모킹
      const memberId = 1;

      const result = await controller.getMemberDetail(req, memberId);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        success: true,
        data: {
          userId: 1,
          name: 'John Doe',
          email: 'john@example.com',
        },
      });
      
      // service의 getMember 메소드가 호출되었는지 검증
      expect(service.getMember).toHaveBeenCalledWith(memberId);
    });
  });
  
  describe('findAvailableTimes', () => {
    it('should return available time slots for a given date and location', async () => {
      const selectDate = '2024-03-15';
      const locationId = 1;

      const result = await controller.findAvailableTimes(selectDate, locationId);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        success: true,
        data: [
          { timeSlot: '09:00-10:00', available: true },
          { timeSlot: '10:00-11:00', available: false },
        ],
      });
      
      // service의 findAvailableTimes 메소드가 호출되었는지 검증
      expect(service.findAvailableTimes).toHaveBeenCalledWith(selectDate, locationId);
    });
  });

  describe('findMatchDetail', () => {
    it('should return match detail for a given matchId', async () => {
      const matchId = 1;

      const result = await controller.findMatchDetail(matchId);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        success: true,
        data: {
          matchId: 1,
          date: '2024-05-20',
          location: 'Stadium A',
          teams: ['Team A', 'Team B']
        },
      });
      
      // service의 findMatchDetail 메소드가 호출되었는지 검증
      expect(service.findMatchDetail).toHaveBeenCalledWith(matchId);
    });
  });

  describe('findMatches', () => {
    it('should return match details for a given matchId', async () => {
      const matchId = 1;

      const result = await controller.findMatches(matchId);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        success: true,
        data: {
          matchId: 1,
          teamA: 'Team A',
          teamB: 'Team B',
          matchDate: '2024-06-01'
        },
      });
      
      // service의 findOneMatch 메소드가 호출되었는지 검증
      expect(service.findOneMatch).toHaveBeenCalledWith(matchId);
    });
  });

  describe('getMatchResultByMatchId', () => {
    it('should return match result for a given matchId and teamId', async () => {
      const teamId = 1;
      const matchId = 1;

      const result = await controller.getMatchResultByMatchId(teamId, matchId);

      expect(result).toEqual({
        matchId: 1,
        teamId: 1,
        result: 'Win',
      });
      
      // service의 getMatchResultByMatchId 메소드가 호출되었는지 검증
      expect(service.getMatchResultByMatchId).toHaveBeenCalledWith(matchId, teamId);
    });
  });

  describe('getMatchResultExist', () => {
    it('should return existence of match result for a given matchId', async () => {
      const matchId = 1;

      const result = await controller.getMatchResultExist(matchId);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        success: true,
        data: true,
      });
      
      // service의 getMatchResultExist 메소드가 호출되었는지 검증
      expect(service.getMatchResultExist).toHaveBeenCalledWith(matchId);
    });
  });

  // 여기에 더 많은 테스트 케이스를 작성할 수 있습니다.
});
