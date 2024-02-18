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

//   describe('findAllSoccerField', () => {

//     it('findAllSoccerField should return a list of soccer fields', async () => {
//         const mockFields = [{id:1}]; // 여기에 경기장 목록 데이터를 모킹
//         jest.spyOn(service, 'findAllSoccerField').mockResolvedValue(mockFields as any);
    
//         const result = await controller.findAllSoccerField();
    
//         expect(result).toEqual({
//           statusCode: HttpStatus.OK,
//           success: true,
//           data: mockFields,
//         });
//         expect(service.findAllSoccerField).toHaveBeenCalled();
//       });

//   });

//   describe('requestUptMatch', () => {

//     it('requestUptMatch should update a match request', async () => {
//         const userId = 1; // 사용자 ID 예시
//         const matchId = 1; // 경기 ID 예시
//         const dto = new updateRequestDto(); // updateRequestDto의 예시 인스턴스

//         dto.date= '2024-02-25';
//         dto.time= '18:00:00';
//         dto.reason = '기상악화';
    
//         jest.spyOn(service, 'requestUptMatch').mockResolvedValue(undefined);
    
//         const req = { user: { id: userId } }; // 예시 요청 객체
//         const result = await controller.requestUptMatch(req as any, matchId, dto);
    
//         expect(result).toEqual({
//           statusCode: HttpStatus.OK,
//           success: true,
//         });
//         expect(service.requestUptMatch).toHaveBeenCalledWith(userId, matchId, dto);
//     });

//   });

  describe('updateMatch', () => {

  });

  describe('requestDelMatch', () => {

  });

  describe('deleteMatch', () => {

  });

  // 여기에 더 많은 테스트 케이스를 작성할 수 있습니다.
});
