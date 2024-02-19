import { Test, TestingModule } from '@nestjs/testing';
import { StatisticsService } from './statistics.service';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { TeamStats } from 'src/match/entities/team-stats.entity';
import { MatchResult } from 'src/match/entities/match-result.entity';
import { PlayerStats } from 'src/match/entities/player-stats.entity';
import { Member } from 'src/member/entities/member.entity';
import { LoggingService } from 'src/logging/logging.service';
import { RedisService } from 'src/redis/redis.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MemberHistoryDto } from './dto/member-history.dto';

describe('StatisticsService', () => {
    let service: StatisticsService;
    let loggingService: LoggingService;
    let redisService: RedisService;
    let teamStatsRepository: Repository<TeamStats>;
    let matchResultRepository: Repository<MatchResult>;
    let playerStatsRepository: Repository<PlayerStats>;
    let memberRepository: Repository<Member>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                StatisticsService,
                {
                    provide: LoggingService,
                    useValue: {
                        log: jest.fn(),
                    },
                },
                {
                    provide: RedisService,
                    useValue: {
                        getTeamStats: jest.fn().mockImplementation((teamId) => {
                            return JSON.stringify({ teamId: 1, win: 1, draw: 1, lose: 1 });
                        }),
                        setTeamStats: jest.fn().mockImplementation((teamStats, teamId) => {
                            return undefined;
                        }),
                        getTeamTopPlayer: jest.fn().mockImplementation((teamId) => {
                            return JSON.stringify({ teamId: 1, playerId: 1, goals: 1 });
                        }),
                        setTeamTopPlayer: jest.fn().mockImplementation((teamTopPlayer, teamId) => {
                            return undefined;
                        }),
                        getTeamPlayers: jest.fn().mockImplementation((teamId) => {
                            return JSON.stringify({ teamId: 1, playerId: 1, goals: 1 });
                        }),
                        setTeamPlayers: jest.fn(),
                        getTeamYellowAndRedCards: jest.fn(),
                        setTeamYellowAndRedCards: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(TeamStats),
                    useValue: {
                        findOne: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(MatchResult),
                    useValue: {
                        findOne: jest.fn(),
                        createQueryBuilder: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(PlayerStats),
                    useValue: {
                        findOne: jest.fn(),
                        createQueryBuilder: jest.fn(),
                        query: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(Member),
                    useValue: {
                        findOne: jest.fn(),
                        createQueryBuilder: jest.fn(),
                        query: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(TeamStats),
                    useValue: {
                        findOne: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<StatisticsService>(StatisticsService);
        loggingService = module.get<LoggingService>(LoggingService);
        redisService = module.get<RedisService>(RedisService);
        teamStatsRepository = module.get<Repository<TeamStats>>(getRepositoryToken(TeamStats));
        matchResultRepository = module.get<Repository<MatchResult>>(
            getRepositoryToken(MatchResult),
        );
        playerStatsRepository = module.get<Repository<PlayerStats>>(
            getRepositoryToken(PlayerStats),
        );
        memberRepository = module.get<Repository<Member>>(getRepositoryToken(Member));
    });

    describe('getTeamStats', () => {
        it('성공 _ redisResult 있는 경우', async () => {
            const teamId = 1;

            const result = await service.getTeamStats(teamId);
            expect(result).toEqual({ teamId: 1, win: 1, draw: 1, lose: 1 });
        });

        it('성공 _ redisResult 없는 경우', async () => {
            const teamId = 1;
            const expectedStats = {
                wins: 1,
                loses: 1,
                draws: 1,
                totalGames: 3,
                goals: 1,
                conceded: 1,
                cleanSheet: 1,
                assists: 1,
                otherTeam: {
                    totalGoals: 1,
                    totalAssists: 1,
                    totalCleanSheet: 1,
                },
            };

            // Mock Redis service to return null to simulate cache miss
            jest.spyOn(redisService, 'getTeamStats').mockResolvedValueOnce(null);
            // Mock the Redis set operation
            jest.spyOn(redisService, 'setTeamStats').mockResolvedValueOnce(undefined);
            // Mock the Redis get operation after setting the value
            jest.spyOn(redisService, 'getTeamStats').mockResolvedValueOnce(
                JSON.stringify(expectedStats),
            );

            // Mock private methods called within getTeamStats
            jest.spyOn(service, 'getGoals').mockResolvedValue(1);
            jest.spyOn(service, 'getAssists').mockResolvedValue(1);
            jest.spyOn(service, 'getCleanSheet').mockResolvedValue(1);
            jest.spyOn(service, 'getConceded').mockResolvedValue(1);
            jest.spyOn(service, 'getWinsAndLosesAndDraws').mockResolvedValue({
                wins: 1,
                loses: 1,
                draws: 1,
                totalGames: 3,
            });
            jest.spyOn(service, 'getStatsForOtherTeams').mockResolvedValue({
                totalGoals: 1,
                totalAssists: 1,
                totalCleanSheet: 1,
            });

            // Call the method to test
            const result = await service.getTeamStats(teamId);

            // Assert the result
            expect(result).toEqual(expectedStats);
        });
    });

    describe('getMemberStats', () => {
        it('성공', async () => {
            const teamId = 1;
            jest.spyOn(service, 'getWinsAndLosesAndDraws').mockResolvedValue({
                wins: 1,
                loses: 1,
                draws: 1,
                totalGames: 3,
            });
            jest.spyOn(service, 'getGoals').mockResolvedValue(1);
            jest.spyOn(service, 'getAssists').mockResolvedValue(1);
            jest.spyOn(service, 'getConceded').mockResolvedValue(1);
            jest.spyOn(service, 'getCleanSheet').mockResolvedValue(1);

            const expectedReturn = {
                wins: 1,
                loses: 1,
                draws: 1,
                totalGames: 3,
                goals: 1,
                conceded: 1,
                cleanSheet: 1,
            };
            const result = await service.getMemberStats(teamId);
            expect(result).toEqual(expectedReturn);
        });
    });

    describe('getConceded', () => {
        it('should return the total goals conceded by the team', async () => {
            const teamId = 1;
            const expectedConcededGoals = 5;

            const subQueryResponse = [{ match_id: 1 }, { match_id: 2 }];

            const getRawOneResponse = { goals: expectedConcededGoals.toString() };

            const subQueryBuilder = {
                select: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                getQuery: jest.fn().mockReturnThis(),
                getRawMany: jest.fn().mockResolvedValue(subQueryResponse),
            };

            const mainQueryBuilder = {
                select: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                setParameters: jest.fn().mockReturnThis(),
                getRawOne: jest.fn().mockResolvedValue(getRawOneResponse),
            };

            jest.spyOn(playerStatsRepository, 'createQueryBuilder').mockReturnValue(
                mainQueryBuilder as any,
            );

            const concededGoals = await service.getConceded(teamId);

            expect(concededGoals).toEqual(expectedConcededGoals);

            expect(subQueryBuilder.select).toHaveBeenCalledWith('sub_stats.match_id');
            expect(subQueryBuilder.where).toHaveBeenCalledWith('sub_stats.team_id = :teamId', {
                teamId,
            });
            expect(mainQueryBuilder.getRawOne).toHaveBeenCalled();
        });
    });

    describe('getGoals', () => {
        it('성공', async () => {
            const teamId = 1;
            const expectedGoals = 5;
            const mockGetRawOne = jest
                .fn()
                .mockResolvedValueOnce({ totalGoals: expectedGoals.toString() });
            const mockQueryBuilder = {
                select: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                getRawOne: mockGetRawOne,
            };
            jest.spyOn(playerStatsRepository, 'createQueryBuilder').mockReturnValue(
                mockQueryBuilder as any,
            );

            const result = await service.getGoals(teamId);
            expect(result).toEqual(expectedGoals);
            expect(mockQueryBuilder.select).toHaveBeenCalledWith([
                'SUM(player_statistics.goals) as totalGoals',
            ]);
            expect(mockQueryBuilder.where).toHaveBeenCalledWith(
                'player_statistics.team_id = :teamId',
                { teamId },
            );
            expect(mockGetRawOne).toHaveBeenCalled();
        });
    });

    describe('getAssists', () => {
        it('성공', async () => {
            const teamId = 1;
            const expectedAssists = 5;
            const mockGetRawOne = jest
                .fn()
                .mockResolvedValueOnce({ totalAssists: expectedAssists.toString() });
            const mockQueryBuilder = {
                select: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                getRawOne: mockGetRawOne,
            };
            jest.spyOn(playerStatsRepository, 'createQueryBuilder').mockReturnValue(
                mockQueryBuilder as any,
            );

            const result = await service.getAssists(teamId);
            expect(result).toEqual(expectedAssists);
            expect(mockQueryBuilder.select).toHaveBeenCalledWith(
                'SUM(stats.assists) as totalAssists',
            );
            expect(mockQueryBuilder.where).toHaveBeenCalledWith('stats.team_id = :teamId', {
                teamId,
            });
            expect(mockGetRawOne).toHaveBeenCalled();
        });
    });

    describe('getCleanSheet', () => {
        it('성공', async () => {
            const teamId = 1;
            const expectedCleenSheet = 5;
            const mockGetRawOne = jest.fn().mockResolvedValueOnce({ count: expectedCleenSheet });
            const mockQueryBuilder = {
                select: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getRawOne: mockGetRawOne,
            };
            jest.spyOn(matchResultRepository, 'createQueryBuilder').mockReturnValue(
                mockQueryBuilder as any,
            );

            const result = await service.getCleanSheet(teamId);
            expect(result).toEqual(expectedCleenSheet);
            expect(mockQueryBuilder.select).toHaveBeenCalledWith(
                'COUNT(match.clean_sheet) as count',
            );
            expect(mockQueryBuilder.where).toHaveBeenCalledWith('match.team_id = :teamId', {
                teamId,
            });
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('match.clean_sheet = true');
            expect(mockGetRawOne).toHaveBeenCalled();
        });
    });

    describe('getWinsAndLosesAndDraws', () => {
        it('성공', async () => {
            const teamId = 1;
            const mockReturn = new TeamStats();
            mockReturn.wins = 1;
            mockReturn.loses = 1;
            mockReturn.draws = 1;
            mockReturn.total_games = 3;
            jest.spyOn(teamStatsRepository, 'findOne').mockResolvedValue(mockReturn);
            const expectedReturn = {
                wins: 1,
                loses: 1,
                draws: 1,
                totalGames: 3,
            };
            const result = await service.getWinsAndLosesAndDraws(teamId);
            expect(result).toEqual(expectedReturn);
        });
    });

    describe('getStatsForOtherTeams', () => {
        it('성공', async () => {
            const myTeamId = 1;
            const expectedStats = {
                totalGoals: 10,
                totalAssists: 8,
                totalCleanSheet: 5,
            };
            // Mock the getRawOne method for myTeamGameCount and otherTeamGameCount
            const mockGetMyTeamGameCount = jest.fn().mockResolvedValueOnce({ myTeamGameCount: 5 });
            const mockGetOtherTeamGameCount = jest
                .fn()
                .mockResolvedValueOnce({ otherTeamGameCount: 4 });

            const mockGetRawMany = jest.fn().mockResolvedValueOnce([
                { totalGoals: '5', totalAssists: '4', totalCleanSheets: '3' },
                { totalGoals: '5', totalAssists: '4', totalCleanSheets: '2' },
            ]);

            const mockQueryBuilder = {
                select: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                groupBy: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                getRawOne: jest.fn(),
                getRawMany: mockGetRawMany,
            };

            jest.spyOn(playerStatsRepository, 'createQueryBuilder').mockReturnValue(
                mockQueryBuilder as any,
            );
            mockQueryBuilder.getRawOne
                .mockImplementationOnce(() => mockGetMyTeamGameCount)
                .mockImplementationOnce(() => mockGetOtherTeamGameCount);

            // Call the method to test
            const result = await service.getStatsForOtherTeams(myTeamId);

            // Assert the result
            expect(result).toEqual(expectedStats);
            expect(playerStatsRepository.createQueryBuilder).toHaveBeenCalledTimes(3); // Called for myTeamGameCount, otherTeamGameCount, and total stats

            expect(mockQueryBuilder.select).toHaveBeenCalledWith(
                'COUNT(DISTINCT match_id) as myTeamGameCount',
            );
            expect(mockQueryBuilder.where).toHaveBeenCalledWith('stats.team_id = :myTeamId', {
                myTeamId,
            });
            expect(mockQueryBuilder.where).toHaveBeenCalledWith('stats.team_id != :myTeamId', {
                myTeamId,
            });
            expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('stats.created_at', 'DESC');
            expect(mockQueryBuilder.groupBy).toHaveBeenCalledWith('sub_stats.match_id');
            expect(mockGetRawMany).toHaveBeenCalled();
        });
    });

    describe('getTopPlayer', () => {
        it('성공_redisResult 있는 경우', async () => {
            const teamId = 1;
            const expectedReturn = {
                teamId: 1,
                playerId: 1,
                goals: 1,
            };
            jest.spyOn(redisService, 'getTeamTopPlayer').mockResolvedValueOnce(
                JSON.stringify(expectedReturn),
            );
            const result = await service.getTopPlayer(teamId);
            expect(result).toEqual(expectedReturn);
        });

        it('성공_redisResult 없는 경우', async () => {
            const teamId = 1;
            const expectedReturn = {
                teamId: 1,
                playerId: 1,
                goals: 1,
            };
            jest.spyOn(redisService, 'getTeamTopPlayer').mockResolvedValueOnce(null);
            jest.spyOn(redisService, 'setTeamTopPlayer').mockResolvedValueOnce(undefined);
            jest.spyOn(redisService, 'getTeamTopPlayer').mockResolvedValueOnce(
                JSON.stringify(expectedReturn),
            );
            jest.spyOn(service, 'getTopGoalsMembers').mockResolvedValue(
                new Array(10).fill({ memberId: 1, goals: 1 }),
            );
            jest.spyOn(service, 'getTopAssistsMembers').mockResolvedValue(
                new Array(10).fill({ memberId: 1, assists: 1 }),
            );
            jest.spyOn(service, 'getTopJoiningMembers').mockResolvedValue(
                new Array(10).fill({ memberId: 1, totalGames: 1 }),
            );
            jest.spyOn(service, 'getTopSaveMembers').mockResolvedValue(
                new Array(10).fill({ memberId: 1, saves: 1 }),
            );
            jest.spyOn(service, 'getTopAttactPoint').mockResolvedValue(
                new Array(10).fill({ memberId: 1, attackPoints: 1 }),
            );

            const result = await service.getTopPlayer(teamId);
            expect(result).toEqual(expectedReturn);
        });
    });

    describe('getTopGoalsMembers', () => {
        it('성공', async () => {
            const teamId = 1;
            const expctedRankGoalsMembers = new Array(10).fill({ memberId: 1, goals: 1 });
            const mockGetRawMany = jest.fn().mockResolvedValueOnce(expctedRankGoalsMembers);
            const mockQueryBuilder = {
                select: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                leftJoin: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                groupBy: jest.fn().mockReturnThis(),
                getRawMany: mockGetRawMany,
            };

            jest.spyOn(playerStatsRepository, 'createQueryBuilder').mockReturnValue(
                mockQueryBuilder as any,
            );

            const result = await service.getTopGoalsMembers(teamId);
            expect(result).toEqual(expctedRankGoalsMembers);
            expect(mockQueryBuilder.select).toHaveBeenCalledWith([
                'stats.team_id as teamId',
                'SUM(stats.goals) as totalGoals',
                'stats.member_id as memberId',
                'users.name userName',
                'profile.image_uuid as image',
            ]);

            expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
                'members',
                'members',
                'stats.member_id = members.id',
            );
            expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
                'users',
                'users',
                'members.user_id = users.id',
            );
            expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
                'profile',
                'profile',
                'profile.user_id = users.id',
            );

            expect(mockQueryBuilder.where).toHaveBeenCalledWith('stats.team_id = :teamId', {
                teamId,
            });

            expect(mockQueryBuilder.groupBy).toHaveBeenCalledWith('stats.member_id');
            expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('totalGoals', 'DESC');
            expect(mockQueryBuilder.limit).toHaveBeenCalledWith(3);
            expect(mockGetRawMany).toHaveBeenCalled();
        });
    });

    describe('getTopAssistsMembers', () => {
        it('성공', async () => {
            const teamId = 1;
            const expctedRankAssistsMembers = new Array(10).fill({ memberId: 1, goals: 1 });
            const mockGetRawMany = jest.fn().mockResolvedValueOnce(expctedRankAssistsMembers);
            const mockQueryBuilder = {
                select: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                leftJoin: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                groupBy: jest.fn().mockReturnThis(),
                getRawMany: mockGetRawMany,
            };

            jest.spyOn(playerStatsRepository, 'createQueryBuilder').mockReturnValue(
                mockQueryBuilder as any,
            );

            const result = await service.getTopAssistsMembers(teamId);
            expect(result).toEqual(expctedRankAssistsMembers);
            expect(mockQueryBuilder.select).toHaveBeenCalledWith([
                'stats.team_id as teamId',
                'SUM(stats.assists) as totalAssists',
                'stats.member_id as memberId',
                'users.name as userName',
                'profile.image_uuid as image',
            ]);

            expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
                'members',
                'members',
                'stats.member_id = members.id',
            );
            expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
                'users',
                'users',
                'members.user_id = users.id',
            );
            expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
                'profile',
                'profile',
                'profile.user_id = users.id',
            );

            expect(mockQueryBuilder.where).toHaveBeenCalledWith('stats.team_id = :teamId', {
                teamId,
            });

            expect(mockQueryBuilder.groupBy).toHaveBeenCalledWith('stats.member_id');
            expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('totalAssists', 'DESC');
            expect(mockQueryBuilder.limit).toHaveBeenCalledWith(3);
            expect(mockGetRawMany).toHaveBeenCalled();
        });
    });

    describe('getTopJoiningMembers', () => {
        it('성공', async () => {
            const teamId = 1;
            const expctedRankJoiningMembers = new Array(10).fill({ memberId: 1, goals: 1 });
            const mockGetRawMany = jest.fn().mockResolvedValueOnce(expctedRankJoiningMembers);
            const mockQueryBuilder = {
                select: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                leftJoin: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                groupBy: jest.fn().mockReturnThis(),
                getRawMany: mockGetRawMany,
            };

            jest.spyOn(playerStatsRepository, 'createQueryBuilder').mockReturnValue(
                mockQueryBuilder as any,
            );

            const result = await service.getTopJoiningMembers(teamId);
            expect(result).toEqual(expctedRankJoiningMembers);
            expect(mockQueryBuilder.select).toHaveBeenCalledWith([
                'stats.team_id as teamId',
                'count(stats.member_id) as joining',
                'stats.member_id as memberId',
                'users.name as userName',
                'profile.image_uuid as image',
            ]);

            expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
                'members',
                'members',
                'stats.member_id = members.id',
            );
            expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
                'users',
                'users',
                'members.user_id = users.id',
            );
            expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
                'profile',
                'profile',
                'profile.user_id = users.id',
            );

            expect(mockQueryBuilder.where).toHaveBeenCalledWith('stats.team_id = :teamId', {
                teamId,
            });

            expect(mockQueryBuilder.groupBy).toHaveBeenCalledWith('stats.member_id');
            expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('joining', 'DESC');
            expect(mockQueryBuilder.limit).toHaveBeenCalledWith(3);
            expect(mockGetRawMany).toHaveBeenCalled();
        });
    });

    describe('getTopSaveMembers', () => {
        it('성공', async () => {
            const teamId = 1;
            const expctedTopSaveMembers = new Array(10).fill({ memberId: 1, goals: 1 });
            const mockGetRawMany = jest.fn().mockResolvedValueOnce(expctedTopSaveMembers);
            const mockQueryBuilder = {
                select: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                leftJoin: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                groupBy: jest.fn().mockReturnThis(),
                getRawMany: mockGetRawMany,
            };

            jest.spyOn(playerStatsRepository, 'createQueryBuilder').mockReturnValue(
                mockQueryBuilder as any,
            );

            const result = await service.getTopSaveMembers(teamId);
            expect(result).toEqual(expctedTopSaveMembers);
            expect(mockQueryBuilder.select).toHaveBeenCalledWith([
                'stats.team_id as teamId',
                'SUM(stats.save) as totalSave',
                'stats.member_id as memberId',
                'users.name as userName',
                'profile.image_uuid as image',
            ]);

            expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
                'members',
                'members',
                'stats.member_id = members.id',
            );
            expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
                'users',
                'users',
                'members.user_id = users.id',
            );
            expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
                'profile',
                'profile',
                'profile.user_id = users.id',
            );

            expect(mockQueryBuilder.where).toHaveBeenCalledWith('stats.team_id = :teamId', {
                teamId,
            });

            expect(mockQueryBuilder.groupBy).toHaveBeenCalledWith('stats.member_id');
            expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('totalSave', 'DESC');
            expect(mockQueryBuilder.limit).toHaveBeenCalledWith(3);
            expect(mockGetRawMany).toHaveBeenCalled();
        });
    });

    describe('getTopAttactPoint', () => {
        it('성공', async () => {
            const teamId = 1;
            const expctedTopAttackPoint = new Array(10).fill({ memberId: 1, goals: 1 });
            const mockGetRawMany = jest.fn().mockResolvedValueOnce(expctedTopAttackPoint);
            const mockQueryBuilder = {
                select: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                leftJoin: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                groupBy: jest.fn().mockReturnThis(),
                getRawMany: mockGetRawMany,
            };

            jest.spyOn(playerStatsRepository, 'createQueryBuilder').mockReturnValue(
                mockQueryBuilder as any,
            );

            const result = await service.getTopAttactPoint(teamId);
            expect(result).toEqual(expctedTopAttackPoint);
            expect(mockQueryBuilder.select).toHaveBeenCalledWith([
                'stats.team_id teamId',
                'SUM(stats.goals) + SUM(stats.assists) as attactPoint ',
                'stats.member_id memberId',
                'users.name userName',
                'profile.image_uuid as image',
            ]);

            expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
                'members',
                'members',
                'stats.member_id = members.id',
            );
            expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
                'users',
                'users',
                'members.user_id = users.id',
            );
            expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
                'profile',
                'profile',
                'profile.user_id = users.id',
            );

            expect(mockQueryBuilder.where).toHaveBeenCalledWith('stats.team_id = :teamId', {
                teamId,
            });

            expect(mockQueryBuilder.groupBy).toHaveBeenCalledWith('stats.member_id');
            expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('attactPoint', 'DESC');
            expect(mockQueryBuilder.limit).toHaveBeenCalledWith(3);
            expect(mockGetRawMany).toHaveBeenCalled();
        });
    });

    describe('getPlayers', () => {
        it('성공', async () => {
            const teamId = 1;

            const expectedPlayersData = [
                {
                    memberId: '1',
                    userName: 'John Doe',
                    image: 'image-uuid',
                    totalGames: '10',
                    totalGoals: '5',
                    totalAssists: '3',
                    attactPoint: '8',
                    totalYellowCards: '1',
                    totalRedCards: '0',
                    totalCleanSheet: '2',
                    totalSave: '0',
                },
            ];

            const expectedReturn = {
                players: expectedPlayersData,
            };

            jest.spyOn(redisService, 'getTeamPlayers').mockResolvedValueOnce(null);

            const mockGetRawMany = jest.fn().mockResolvedValueOnce(expectedPlayersData);
            const mockQueryBuilder = {
                select: jest.fn().mockReturnThis(),
                leftJoin: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                groupBy: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getRawMany: mockGetRawMany,
            };
            jest.spyOn(memberRepository, 'createQueryBuilder').mockReturnValue(
                mockQueryBuilder as any,
            );

            jest.spyOn(redisService, 'setTeamPlayers').mockResolvedValueOnce(undefined);
            jest.spyOn(redisService, 'getTeamPlayers').mockResolvedValueOnce(
                JSON.stringify(expectedPlayersData),
            );

            const result = await service.getPlayers(teamId);

            expect(result).toEqual(expectedReturn);
            expect(redisService.getTeamPlayers).toHaveBeenCalledTimes(2);
            expect(redisService.setTeamPlayers).toHaveBeenCalledWith(
                JSON.stringify(expectedPlayersData),
                teamId,
            );
            expect(memberRepository.createQueryBuilder).toHaveBeenCalledWith('members');
            expect(mockGetRawMany).toHaveBeenCalled();
        });
    });

    describe('getYellowAndRedCards', () => {
        it('성공_redisResult가 있는 경우', async () => {
            const teamId = 1;
            const expectedYellowAndRedCards = [
                { yellow: '2', red: '0', created: '1/1/2023' },
                { yellow: '1', red: '1', created: '1/2/2023' },
            ];
            const mockReturn = JSON.stringify(expectedYellowAndRedCards);

            jest.spyOn(redisService, 'getTeamYellowAndRedCards').mockResolvedValueOnce(mockReturn);

            const result = await service.getYellowAndRedCards(teamId);

            const expectedResult = {
                yellowAndRedCards: expectedYellowAndRedCards.map((card) => ({
                    ...card,
                    created: new Date(card.created).toLocaleDateString(),
                })),
            };

            expect(result).toEqual(expectedResult);
        });

        it('성공_redisResult가 없는 경우', async () => {
            const teamId = 1;
            const expectedYellowAndRedCards = [
                { yellow: '2', red: '0', created: '1/1/2023' },
                { yellow: '1', red: '1', created: '1/2/2023' },
            ];

            jest.spyOn(redisService, 'getTeamYellowAndRedCards').mockResolvedValueOnce(null);

            const mockMatchCountGetRawOne = jest.fn().mockResolvedValueOnce({ count: 10 });
            const matchCountQueryBuilder = {
                select: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                getRawOne: mockMatchCountGetRawOne,
            };
            jest.spyOn(playerStatsRepository, 'createQueryBuilder').mockReturnValueOnce(
                matchCountQueryBuilder as any,
            );

            const mockGetRawMany = jest.fn().mockResolvedValueOnce(
                expectedYellowAndRedCards.map((card) => ({
                    yellow: card.yellow,
                    red: card.red,
                    created: new Date(card.created).toISOString(),
                })),
            );
            const rawYellowAndRedCardsQueryBuilder = {
                select: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                groupBy: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                offset: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                getRawMany: mockGetRawMany,
            };
            jest.spyOn(playerStatsRepository, 'createQueryBuilder').mockReturnValueOnce(
                rawYellowAndRedCardsQueryBuilder as any,
            );

            jest.spyOn(redisService, 'setTeamYellowAndRedCards').mockResolvedValueOnce(undefined);
            jest.spyOn(redisService, 'getTeamYellowAndRedCards').mockResolvedValueOnce(
                JSON.stringify(expectedYellowAndRedCards),
            );

            const result = await service.getYellowAndRedCards(teamId);

            const expectedResult = {
                yellowAndRedCards: expectedYellowAndRedCards.map((card) => ({
                    ...card,
                    created: new Date(card.created).toLocaleDateString(),
                })),
            };

            expect(result).toEqual(expectedResult);
            expect(redisService.getTeamYellowAndRedCards).toHaveBeenCalledTimes(2);
            expect(redisService.setTeamYellowAndRedCards).toHaveBeenCalledWith(
                JSON.stringify(expectedYellowAndRedCards),
                teamId,
            );
            expect(playerStatsRepository.createQueryBuilder).toHaveBeenCalledTimes(2);
            expect(mockGetRawMany).toHaveBeenCalled();
        });
    });

    describe('getMemberHistory', () => {
        it('성공', async () => {
            const userId = 1;
            const mockHistoryData = [
                {
                    teamId: '1',
                    teamName: 'Team A',
                    joinDate: new Date().toISOString(),
                    deletedAt: null,
                    totalGames: '10',
                    totalGoals: '5',
                    totalAssists: '3',
                    totalPoint: '8',
                    totalSave: '2',
                    totalCleanSheet: '4',
                },
            ];
            jest.spyOn(memberRepository, 'query').mockResolvedValue(mockHistoryData);
            const result = await service.getMemberHistory(userId);

            expect(memberRepository.query).toHaveBeenCalledWith(expect.any(String), [userId]);
            expect(result).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        teamId: expect.any(String),
                        teamName: expect.any(String),
                        joinDate: expect.any(Date),
                        deletedAt: null,
                        totalGames: expect.any(Number),
                        totalGoals: expect.any(Number),
                        totalAssists: expect.any(Number),
                        totalPoint: expect.any(Number),
                        totalSave: expect.any(Number),
                        totalCleanSheet: expect.any(Number),
                    }),
                ]),
            );
        });
    });

    describe('getMemberMatchRecord', () => {
        it('성공', async () => {
            const memberId = 1;
            const mockMatchRecordData = [
                {
                    matchId: 1,
                    memberId: memberId,
                    goals: 2,
                    assists: 1,
                    point: 3,
                    save: 0,
                    cleanSheet: 1,
                    matchDate: new Date().toISOString(),
                    matchTime: '14:00:00',
                    opposingTeamName: 'Opponent Team',
                },
            ];

            jest.spyOn(playerStatsRepository, 'query').mockResolvedValue(mockMatchRecordData);

            const result = await service.getMembetMatchRecord(memberId);

            expect(result).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        matchId: expect.any(Number),
                        memberId: expect.any(Number),
                        goals: expect.any(Number),
                        assists: expect.any(Number),
                        point: expect.any(Number),
                        save: expect.any(Number),
                        cleanSheet: expect.any(Number),
                        matchDate: expect.any(Date),
                        matchTime: expect.any(String),
                        opposingTeamName: expect.any(String),
                    }),
                ]),
            );
            expect(playerStatsRepository.query).toHaveBeenCalledWith(expect.any(String), [
                memberId,
            ]);
        });
    });
});
