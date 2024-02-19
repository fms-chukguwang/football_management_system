import { Test, TestingModule } from '@nestjs/testing';
import { TournamentService } from './tournament.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TournamentModel } from './entities/tournament.entity';
import { EntityManager, Repository } from 'typeorm';
import { CreateTournamentDto } from './dtos/create-tournament.dto';
import { LoggingService } from 'src/logging/logging.service';
import { TeamModel } from 'src/team/entities/team.entity';
import { UpdateTournamentDto } from './dtos/update-tournament.dto';

describe('TournamentService', () => {
    let service: TournamentService;
    // let mockTournamentRepository: Partial<Record<keyof Repository<TournamentModel>, jest.Mock>>;
    let mockTournamentRepository: any;
    let loggingService: LoggingService;
    let entityManager: EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TournamentService,
                {
                    provide: getRepositoryToken(TournamentModel),
                    useValue: {
                        create: jest.fn(),
                        save: jest.fn(),
                    },
                },
                {
                    provide: LoggingService,
                    useValue: {
                        error: jest.fn(),
                        warn: jest.fn(),
                        info: jest.fn(),
                    },
                },
                {
                    provide: EntityManager,
                    useValue: {
                        transaction: jest.fn(),
                        findOne: jest.fn(),
                        save: jest.fn(),
                        update: jest.fn(),
                    },
                },
            ],
        }).compile();

        // createQueryBuilder가 mock QueryBuilder를 반환하도록 설정합니다.
        service = module.get<TournamentService>(TournamentService);
        loggingService = module.get<LoggingService>(LoggingService);
        entityManager = module.get<EntityManager>(EntityManager);
        mockTournamentRepository = module.get(getRepositoryToken(TournamentModel));
    });

    it('createTournament 테스트', async () => {
        const createTournamentDto: CreateTournamentDto = {
            address: 'test address',
            name: 'test name',
            teamLimit: 10,
            registerDeadline: new Date(),
            tournamentDate: new Date(),
        };
        const expectedSavedTournament = {
            id: 1,
            ...createTournamentDto,
        };

        mockTournamentRepository.save.mockResolvedValue(expectedSavedTournament);

        const result = await service.createTournament(createTournamentDto);

        expect(mockTournamentRepository.save).toHaveBeenCalledWith(createTournamentDto);
        expect(result).toEqual(expectedSavedTournament);
    });

    describe('applyTournament 테스트', () => {
        it('applyTournament 테스트', async () => {
            const tournamentId = 1;
            const teamId = 1;
            const mockTournament = new TournamentModel();
            mockTournament.id = tournamentId;
            mockTournament.teams = [];
            mockTournament.registerDeadline = new Date(Date.now() + 86400000); // One day in the future
            mockTournament.teamLimit = 10;

            const mockTeam = new TeamModel();
            mockTeam.id = teamId;

            const queryBuilder = {
                setLock: jest.fn().mockReturnThis(),
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                getOne: jest.fn().mockResolvedValue(mockTournament),
            };
            entityManager.transaction = jest
                .fn()
                .mockImplementation(async (cb) => cb(entityManager));
            entityManager.createQueryBuilder = jest.fn().mockReturnValue(queryBuilder);
            entityManager.findOne = jest.fn().mockResolvedValue(mockTeam);

            const result = await service.applyTournament(tournamentId, teamId);
            expect(result).toEqual('신청이 완료되었습니다.');
            expect(queryBuilder.getOne).toHaveBeenCalledTimes(1);
            expect(entityManager.findOne).toHaveBeenCalledWith(TeamModel, {
                where: { id: teamId },
            });
            expect(entityManager.transaction).toHaveBeenCalled();
            expect(loggingService.warn).not.toHaveBeenCalled();
        });

        it('실패 _ 존재하지 않는 토너먼트', async () => {
            const tournamentId = 1;
            const teamId = 1;
            const mockTournament = null;

            const mockTeam = new TeamModel();
            mockTeam.id = teamId;

            const queryBuilder = {
                setLock: jest.fn().mockReturnThis(),
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                getOne: jest.fn().mockResolvedValue(mockTournament),
            };
            entityManager.transaction = jest
                .fn()
                .mockImplementation(async (cb) => cb(entityManager));
            entityManager.createQueryBuilder = jest.fn().mockReturnValue(queryBuilder);
            entityManager.findOne = jest.fn().mockResolvedValue(mockTeam);

            const result = await service.applyTournament(tournamentId, teamId);

            expect(result).toEqual('토너먼트가 존재하지 않습니다.');
            expect(loggingService.warn).toHaveBeenCalled();
        });

        it('실패 _ 신청 마감일이 지났습니다.', async () => {
            const tournamentId = 1;
            const teamId = 1;
            const mockTournament = new TournamentModel();
            mockTournament.id = tournamentId;
            mockTournament.teams = [];
            mockTournament.registerDeadline = new Date(Date.now() - 86400000); // One day in the future
            mockTournament.teamLimit = 10;

            const mockTeam = new TeamModel();
            mockTeam.id = teamId;

            const queryBuilder = {
                setLock: jest.fn().mockReturnThis(),
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                getOne: jest.fn().mockResolvedValue(mockTournament),
            };
            entityManager.transaction = jest
                .fn()
                .mockImplementation(async (cb) => cb(entityManager));
            entityManager.createQueryBuilder = jest.fn().mockReturnValue(queryBuilder);
            entityManager.findOne = jest.fn().mockResolvedValue(mockTeam);

            const result = await service.applyTournament(tournamentId, teamId);

            expect(result).toEqual('신청 마감일이 지났습니다.');
        });

        it('실패 _ 신청이 마감 된 토너먼트입니다.', async () => {
            const tournamentId = 1;
            const teamId = 1;
            const mockTournament = new TournamentModel();
            mockTournament.id = tournamentId;
            mockTournament.teams = [];
            mockTournament.registerDeadline = new Date(Date.now() + 86400000); // One day in the future
            mockTournament.teamLimit = 10;
            mockTournament.isFinished = true;

            const mockTeam = new TeamModel();
            mockTeam.id = teamId;

            const queryBuilder = {
                setLock: jest.fn().mockReturnThis(),
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                getOne: jest.fn().mockResolvedValue(mockTournament),
            };
            entityManager.transaction = jest
                .fn()
                .mockImplementation(async (cb) => cb(entityManager));
            entityManager.createQueryBuilder = jest.fn().mockReturnValue(queryBuilder);
            entityManager.findOne = jest.fn().mockResolvedValue(mockTeam);

            const result = await service.applyTournament(tournamentId, teamId);

            expect(result).toEqual('신청이 마감 된 토너먼트입니다.');
            expect(queryBuilder.getOne).toHaveBeenCalledTimes(1);
            expect(entityManager.transaction).toHaveBeenCalled();
            expect(loggingService.warn).not.toHaveBeenCalled();
        });

        it('실패 _ 이미 신청한 팀입니다.', async () => {
            const tournamentId = 1;
            const teamId = 1;
            const mockTournament = new TournamentModel();
            const existingTeam = new TeamModel();
            existingTeam.id = teamId;
            mockTournament.id = tournamentId;
            mockTournament.teams = [existingTeam];
            mockTournament.registerDeadline = new Date(Date.now() + 86400000); // One day in the future
            mockTournament.teamLimit = 10;
            mockTournament.isFinished = false;

            const mockTeam = new TeamModel();
            mockTeam.id = teamId;

            const queryBuilder = {
                setLock: jest.fn().mockReturnThis(),
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                getOne: jest.fn().mockResolvedValue(mockTournament),
            };
            entityManager.transaction = jest
                .fn()
                .mockImplementation(async (cb) => cb(entityManager));
            entityManager.createQueryBuilder = jest.fn().mockReturnValue(queryBuilder);
            entityManager.findOne = jest.fn().mockResolvedValue(mockTeam);

            const result = await service.applyTournament(tournamentId, teamId);

            expect(result).toEqual('이미 신청한 팀입니다.');
            expect(queryBuilder.getOne).toHaveBeenCalledTimes(1);
            expect(entityManager.transaction).toHaveBeenCalled();
            expect(loggingService.warn).not.toHaveBeenCalled();
        });

        it('실패 _ 존재하지 않는 팀', async () => {
            const tournamentId = 1;
            const teamId = 1;
            const mockTournament = new TournamentModel();
            mockTournament.id = tournamentId;
            mockTournament.teams = [];
            mockTournament.registerDeadline = new Date(Date.now() + 86400000); // One day in the future
            mockTournament.teamLimit = 10;
            mockTournament.isFinished = false;

            const queryBuilder = {
                setLock: jest.fn().mockReturnThis(),
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                getOne: jest.fn().mockResolvedValue(mockTournament),
            };
            entityManager.transaction = jest
                .fn()
                .mockImplementation(async (cb) => cb(entityManager));
            entityManager.createQueryBuilder = jest.fn().mockReturnValue(queryBuilder);
            entityManager.findOne = jest.fn().mockResolvedValue(undefined);

            const result = await service.applyTournament(tournamentId, teamId);

            expect(result).toEqual('존재하지 않는 팀입니다.');
            expect(queryBuilder.getOne).toHaveBeenCalledTimes(1);
            expect(entityManager.transaction).toHaveBeenCalled();
            expect(loggingService.warn).not.toHaveBeenCalled();
        });
    });

    describe('cancelTournament 테스트', () => {
        it('성공', async () => {
            const tournamentId = 1;
            const teamId = 1;
            const team1 = new TeamModel();
            team1.id = 1;
            const team2 = new TeamModel();
            team2.id = 2;
            const mockTeams = [team1, team2];

            const mockTournament = new TournamentModel();
            mockTournament.id = tournamentId;
            mockTournament.teams = mockTeams;
            const queryBuilder = {
                setLock: jest.fn().mockReturnThis(),
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                getOne: jest.fn().mockResolvedValue(mockTournament),
            };

            entityManager.transaction = jest
                .fn()
                .mockImplementation(async (cb) => cb(entityManager));
            entityManager.createQueryBuilder = jest.fn().mockReturnValue(queryBuilder);
            entityManager.save = jest.fn().mockResolvedValue(mockTournament);

            const result = await service.cancelTournament(tournamentId, teamId);
            expect(result).toEqual('취소가 완료되었습니다.');
        });
        it('실패 _ 토너먼트가 존재하지 않는 경우', async () => {
            const tournamentId = 1;
            const teamId = 1;
            const team1 = new TeamModel();
            team1.id = 1;
            const team2 = new TeamModel();
            team2.id = 2;
            const mockTeams = [team1, team2];

            const mockTournament = new TournamentModel();
            mockTournament.id = tournamentId;
            mockTournament.teams = mockTeams;
            const queryBuilder = {
                setLock: jest.fn().mockReturnThis(),
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                getOne: jest.fn().mockResolvedValue(null),
            };

            entityManager.transaction = jest
                .fn()
                .mockImplementation(async (cb) => cb(entityManager));
            entityManager.createQueryBuilder = jest.fn().mockReturnValue(queryBuilder);
            entityManager.save = jest.fn().mockResolvedValue(mockTournament);

            const result = await service.cancelTournament(tournamentId, teamId);
            expect(result).toEqual('토너먼트가 존재하지 않습니다.');

            expect(loggingService.warn).toHaveBeenCalled();
            expect(loggingService.warn).toHaveBeenCalledWith(
                `존재하지 않는 토너먼트 아이디 ${tournamentId}에 취소`,
            );
        });

        it('실패 _ 신청 마감일이 지난 경우', async () => {
            const tournamentId = 1;
            const teamId = 1;
            const team1 = new TeamModel();
            team1.id = 1;
            const team2 = new TeamModel();
            team2.id = 2;
            const mockTeams = [team1, team2];

            const mockTournament = new TournamentModel();
            mockTournament.id = tournamentId;
            mockTournament.teams = mockTeams;
            mockTournament.registerDeadline = new Date(Date.now() - 86400000);
            const queryBuilder = {
                setLock: jest.fn().mockReturnThis(),
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                getOne: jest.fn().mockResolvedValue(mockTournament),
            };

            entityManager.transaction = jest
                .fn()
                .mockImplementation(async (cb) => cb(entityManager));
            entityManager.createQueryBuilder = jest.fn().mockReturnValue(queryBuilder);
            entityManager.save = jest.fn().mockResolvedValue(mockTournament);

            const result = await service.cancelTournament(tournamentId, teamId);
            expect(result).toEqual('신청 마감일이 지났습니다.');
        });

        it('실패 _ 신청하지 않은 팀', async () => {
            const tournamentId = 1;
            const teamId = 3;
            const team1 = new TeamModel();
            team1.id = 1;
            const team2 = new TeamModel();
            team2.id = 2;
            const mockTeams = [team1, team2];

            const mockTournament = new TournamentModel();
            mockTournament.id = tournamentId;
            mockTournament.teams = mockTeams;
            const queryBuilder = {
                setLock: jest.fn().mockReturnThis(),
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                getOne: jest.fn().mockResolvedValue(mockTournament),
            };

            entityManager.transaction = jest
                .fn()
                .mockImplementation(async (cb) => cb(entityManager));
            entityManager.createQueryBuilder = jest.fn().mockReturnValue(queryBuilder);
            entityManager.save = jest.fn().mockResolvedValue(mockTournament);

            const result = await service.cancelTournament(tournamentId, teamId);
            expect(result).toEqual('신청하지 않은 팀입니다.');
        });
    });

    describe('updateTournament 테스트', () => {
        it('성공', async () => {
            const tournamentId = 1;
            const updateTournamentDto = new UpdateTournamentDto();
            updateTournamentDto.address = 'test address';

            const mockTournament = new TournamentModel();
            mockTournament.id = tournamentId;
            mockTournament.teams = [];
            const queryBuilder = {
                setLock: jest.fn().mockReturnThis(),
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                getOne: jest.fn().mockResolvedValue(mockTournament),
            };

            entityManager.transaction = jest
                .fn()
                .mockImplementation(async (cb) => cb(entityManager));

            entityManager.createQueryBuilder = jest.fn().mockReturnValue(queryBuilder);
            entityManager.update = jest.fn().mockResolvedValue(mockTournament);

            const result = await service.updateTournament(tournamentId, updateTournamentDto);
            expect(result).toEqual('수정이 완료되었습니다.');
            expect(entityManager.update).toHaveBeenCalledWith(
                TournamentModel,
                { id: tournamentId },
                updateTournamentDto,
            );
        });

        it('실패 _ 토너먼트가 존재하지 않는 경우', async () => {
            const tournamentId = 1;
            const updateTournamentDto = new UpdateTournamentDto();
            updateTournamentDto.address = 'test address';

            const mockTournament = new TournamentModel();
            mockTournament.id = tournamentId;
            mockTournament.teams = [];
            const queryBuilder = {
                setLock: jest.fn().mockReturnThis(),
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                getOne: jest.fn().mockResolvedValue(null),
            };

            entityManager.transaction = jest
                .fn()
                .mockImplementation(async (cb) => cb(entityManager));

            entityManager.createQueryBuilder = jest.fn().mockReturnValue(queryBuilder);
            entityManager.update = jest.fn().mockResolvedValue(mockTournament);

            const result = await service.updateTournament(tournamentId, updateTournamentDto);
            expect(result).toEqual('토너먼트가 존재하지 않습니다.');
            expect(loggingService.warn).toHaveBeenCalled();
            expect(loggingService.warn).toHaveBeenCalledWith(
                `존재하지 않는 토너먼트 아이디 ${tournamentId}에 수정`,
            );
        });
    });

    describe('closeFinishedTournaments', () => {
        it('성공', async () => {
            const mockTournament = new TournamentModel();
            const team1 = new TeamModel();
            team1.id = 1;
            const team2 = new TeamModel();
            team2.id = 2;
            const team3 = new TeamModel();
            team3.id = 3;

            mockTournament.teams = [team1, team2, team3];
            mockTournament.teamLimit = 4;
            mockTournament.isFinished = false;
            mockTournament.isCancelled = false;

            mockTournamentRepository.find = jest
                .fn()
                .mockResolvedValue([mockTournament, mockTournament, mockTournament]);

            mockTournamentRepository.save = jest.fn().mockResolvedValue(mockTournament);

            expect(await service.closeFinishedTournaments()).toEqual(undefined);
            expect(mockTournamentRepository.find).toHaveBeenCalled();
            expect(mockTournamentRepository.save).toHaveBeenCalled();
        });
        it('성공 _ teamLimit > teams.length', async () => {
            const mockTournament = new TournamentModel();
            const team1 = new TeamModel();
            team1.id = 1;
            const team2 = new TeamModel();
            team2.id = 2;
            const team3 = new TeamModel();
            team3.id = 3;

            mockTournament.teams = [team1, team2, team3];
            mockTournament.teamLimit = 2;
            mockTournament.isFinished = false;
            mockTournament.isCancelled = false;

            mockTournamentRepository.find = jest
                .fn()
                .mockResolvedValue([mockTournament, mockTournament, mockTournament]);

            mockTournamentRepository.save = jest.fn().mockResolvedValue(mockTournament);

            expect(await service.closeFinishedTournaments()).toEqual(undefined);
            expect(mockTournamentRepository.find).toHaveBeenCalled();
            expect(mockTournamentRepository.save).not.toHaveBeenCalled();
        });
    });
});
