import { Test, TestingModule } from '@nestjs/testing';
import { FormationController } from './formation.controller';
import { FormationService } from './formation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExecutionContext } from '@nestjs/common';
import { DataSource } from 'typeorm';

describe('FormationController', () => {
  let controller: FormationController;
  let service: FormationService;

  // Mocked services and guards
  const mockFormationService = {
    getPopularFormation: jest.fn(),
    getBestFormation: jest.fn(),
    getWarningmember: jest.fn(),
    getMatchFormation: jest.fn(),
    saveMatchFormation: jest.fn(),
  };

  const mockJwtAuthGuard = {
    canActivate: (context: ExecutionContext) => {
      return true; // Simulates successful guard operation
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FormationController],
      providers: [
        {
          provide: FormationService,
          useValue: mockFormationService,
        },
        {
          provide: DataSource,
          useValue: {}, // You might need to mock this if used directly in the controller
        },
      ],
    })
    .overrideGuard(JwtAuthGuard)
    .useValue(mockJwtAuthGuard)
    .compile();

    controller = module.get<FormationController>(FormationController);
    service = module.get<FormationService>(FormationService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getPopularFormation', () => {
    it('should return an array of popular formations', async () => {
      mockFormationService.getPopularFormation.mockResolvedValue(['4-4-2', '3-5-2']);
      expect(await controller.getPopularFormation()).toEqual(['4-4-2', '3-5-2']);
      expect(mockFormationService.getPopularFormation).toHaveBeenCalled();
    });
  });

  describe('getBestFormation', () => {
    it('should return the best formation', async () => {
      const homeTeamId = 1;
      const opponentTeamId = 2;
      mockFormationService.getBestFormation.mockResolvedValue('4-3-3');
      expect(await controller.getBestFormation(homeTeamId, opponentTeamId)).toEqual('4-3-3');
      expect(mockFormationService.getBestFormation).toHaveBeenCalledWith(homeTeamId, opponentTeamId);
    });
  });

  describe('getWarningmember', () => {
    it('should return warning members', async () => {
      const teamId = 1;
      mockFormationService.getWarningmember.mockResolvedValue(['Player1', 'Player2']);
      expect(await controller.getWarningmember(teamId)).toEqual(['Player1', 'Player2']);
      expect(mockFormationService.getWarningmember).toHaveBeenCalledWith(teamId);
    });
  });

  describe('getMatchFormation', () => {
    it('should return match formation', async () => {
      const teamId = 1;
      const matchId = 2;
      mockFormationService.getMatchFormation.mockResolvedValue('4-4-2');
      const result = await controller.getMatchFormation(teamId, matchId);
      expect(result.data).toEqual('4-4-2');
      expect(mockFormationService.getMatchFormation).toHaveBeenCalledWith(teamId, matchId);
    });
  });

  describe('saveMatchFormation', () => {
    it('should save match formation', async () => {
      const teamId = 1;
      const matchId = 2;
      //const updateFormationDto = { formation: '4-4-2' };
      const updateFormationDto = {
        currentFormation: '4-4-2',
        playerPositions: [
            { id: 1, name: '홍길동', position: 'FW' },
            // 다른 플레이어 포지션들...
        ],
        };
      mockFormationService.saveMatchFormation.mockResolvedValue('Formation Saved');
      const result = await controller.saveMatchFormation(teamId, matchId, updateFormationDto);
      expect(result.data).toEqual('Formation Saved');
      expect(mockFormationService.saveMatchFormation).toHaveBeenCalledWith(teamId, matchId, updateFormationDto);
    });
  });
});
