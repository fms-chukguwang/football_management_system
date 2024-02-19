import { Test, TestingModule } from '@nestjs/testing';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';
import { IsMemberGuard } from 'src/member/guard/is-member.guard';
import { StatisticsTestService } from './statistics.service.test';
import { StatisticsDto } from './dto/statistics.dto';
import { TopPlayerDto } from './dto/top-player.dto';
import { PlayersDto } from './dto/players.dto';
import { InternalServerErrorException } from '@nestjs/common';
import { YellowAndRedCardsDto } from './dto/yellow-and-red-cards.dto';
import { MemberRecordDto } from './dto/member-record.dto';
import { MemberHistoryDto } from './dto/member-history.dto';

describe('StatisticsController', () => {
    let controller: StatisticsController;
    let service: StatisticsService;
    let testService: StatisticsTestService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [StatisticsController],
            providers: [
                {
                    provide: StatisticsService,
                    useValue: {
                        getTeamStats: jest.fn(),
                        getMemberStats: jest.fn(),
                        getMemberHistory: jest.fn(),
                        getMembetMatchRecord: jest.fn(),
                    },
                },
                {
                    provide: StatisticsTestService,
                    useValue: {
                        getTeamStats: jest.fn(),
                        getTopPlayer: jest.fn(),
                        getPlayers: jest.fn(),
                        getMemberStats: jest.fn(),
                        getYellowAndRedCards: jest.fn(),
                    },
                },
            ],
        })
            .overrideGuard(IsMemberGuard)
            .useValue({
                canActivate: () => true,
            })
            .compile();

        controller = module.get<StatisticsController>(StatisticsController);
        service = module.get<StatisticsService>(StatisticsService);
        testService = module.get<StatisticsTestService>(StatisticsTestService);
    });

    describe('getTeamStats', () => {
        it('팀 승무패 가져오기', async () => {
            const teamId = 1;

            const mockTeamStats = new StatisticsDto();
            jest.spyOn(testService, 'getTeamStats').mockResolvedValue(mockTeamStats);
            const result = await controller.getTeamStats(teamId);
            expect(result).toEqual(mockTeamStats);
            expect(testService.getTeamStats).toHaveBeenCalledWith(teamId);
        });
    });

    describe('getTopPlayer', () => {
        it('TOP 플레이어 가져오기', async () => {
            const teamId = 1;
            const mockTopPlayerStat = new TopPlayerDto();
            jest.spyOn(testService, 'getTopPlayer').mockResolvedValue(mockTopPlayerStat);
            const result = await controller.getTopPlayer(teamId);

            expect(result).toEqual(mockTopPlayerStat);
            expect(testService.getTopPlayer).toHaveBeenCalledWith(teamId);
        });
    });

    describe('getPlayers', () => {
        it('팀에서 회원 목록 가져오기 _ 성공', async () => {
            const teamId = 1;
            const mockPlayer = new PlayersDto();
            jest.spyOn(testService, 'getPlayers').mockResolvedValue(mockPlayer);
            const result = await controller.getPlayers(teamId);
            expect(result).toEqual(mockPlayer);
            expect(testService.getPlayers).toHaveBeenCalledWith(teamId);
            expect(testService.getPlayers).toHaveBeenCalledTimes(1);
        });

        it('팀에서 회원 목록 가져오기 _ 실패', async () => {
            const teamId = 1;
            jest.spyOn(testService, 'getPlayers').mockRejectedValue(
                new InternalServerErrorException(),
            );
            await expect(controller.getPlayers(teamId)).rejects.toThrow(
                InternalServerErrorException,
            );
        });
    });

    describe('getMemberStats', () => {
        it('성공', async () => {
            const memberId = 1;
            const mockReturn = new StatisticsDto();
            jest.spyOn(service, 'getMemberStats').mockResolvedValue(mockReturn);
            const result = await controller.getMemberStats(memberId);
            expect(result).toEqual(mockReturn);
            expect(service.getMemberStats).toHaveBeenCalledWith(memberId);
        });
    });

    describe('getYellowAndRedCards', () => {
        it('팀에서 카드 통계 가져오기', async () => {
            const teamId = 1;
            const mockReturn = new YellowAndRedCardsDto();
            jest.spyOn(testService, 'getYellowAndRedCards').mockResolvedValue(mockReturn);
            const result = await controller.getYellowAndRedCards(teamId);
            expect(result).toEqual(mockReturn);
            expect(testService.getYellowAndRedCards).toHaveBeenCalledWith(teamId);
        });
    });

    describe('getMemberHistory', () => {
        it('멤버 히스토리 가져오기', async () => {
            const req = {
                member: {
                    user: {
                        id: 1,
                    },
                },
            };

            const mockReturn = new MemberHistoryDto();
            jest.spyOn(service, 'getMemberHistory').mockResolvedValue(mockReturn);
            const result = await controller.getMemberHistory(req as any);
            expect(result).toEqual(mockReturn);
            expect(service.getMemberHistory).toHaveBeenCalledWith(req.member.user.id);
        });
    });

    describe('getMemberMatchRecord', () => {
        it('멤버 개인 경기기록 가져오기', async () => {
            const memberId = 1;
            const mockReturn = new MemberRecordDto();
            jest.spyOn(service, 'getMembetMatchRecord').mockResolvedValue(mockReturn);
            const result = await controller.getMemberMatchRecord(memberId);
            expect(result).toEqual(mockReturn);
            expect(service.getMembetMatchRecord).toHaveBeenCalledWith(memberId);
        });
    });
});
