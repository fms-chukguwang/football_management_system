import { Test, TestingModule } from '@nestjs/testing';
import { TeamService } from './team.service';
import { Not, Repository } from 'typeorm';
import { TeamModel } from './entities/team.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CommonService } from 'src/common/common.service';
import { AwsService } from 'src/aws/aws.service';
import { LocationService } from 'src/location/location.service';
import { MemberService } from 'src/member/member.service';
import { ChatsService } from 'src/chats/chats.service';
import { RedisService } from 'src/redis/redis.service';
import { NotFoundException } from '@nestjs/common';
import { Gender } from 'src/enums/gender.enum';

describe('TeamService', () => {
    let service: TeamService;
    let repository: Repository<TeamModel>;
    let commonService: CommonService;
    let awsService: AwsService;
    let redisService: RedisService;
    let locationService: LocationService;
    let memberService: MemberService;
    let chatsService: ChatsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TeamService,
                {
                    provide: getRepositoryToken(TeamModel),
                    useValue: {
                        find: jest.fn(),
                        findOne: jest.fn(),
                        save: jest.fn(),
                        exists: jest.fn(),
                        findAndCount: jest.fn(),
                        createQueryBuilder: jest.fn(),
                    },
                },
                {
                    provide: CommonService,
                    useValue: {
                        paginate: jest.fn(),
                    },
                },
                {
                    provide: AwsService,
                    useValue: {
                        upload: jest.fn(),
                    },
                },
                {
                    provide: RedisService,
                    useValue: {
                        getTeamDetail: jest.fn(),
                        setTeamDetail: jest.fn(),
                    },
                },
                {
                    provide: LocationService,
                    useValue: {
                        getLocation: jest.fn(),
                    },
                },
                {
                    provide: MemberService,
                    useValue: {
                        createMember: jest.fn(),
                    },
                },
                {
                    provide: ChatsService,
                    useValue: {
                        createChat: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<TeamService>(TeamService);

        repository = module.get<Repository<TeamModel>>(getRepositoryToken(TeamModel));
        redisService = module.get<RedisService>(RedisService);
    });
    describe('findOneById', () => {
        // 질문. 이렇게 짜는게 맞는건지?
        it('성공', async () => {
            const id = 1;
            const mockReturn = new TeamModel();
            mockReturn.id = id;
            mockReturn.name = 'test';
            mockReturn.createdAt = new Date();
            mockReturn.updatedAt = new Date();

            jest.spyOn(repository, 'findOne').mockResolvedValue(mockReturn);
            const result = await service.findOneById(id);
            expect(result).toEqual(mockReturn);
        });

        it('실패_team이 없는 경우', async () => {
            const id = 1;
            jest.spyOn(repository, 'findOne').mockResolvedValue(null);
            expect(async () => await service.findOneById(id)).rejects.toThrow(
                new NotFoundException('팀을 찾을 수 없습니다.'),
            );
        });
    });

    describe('paginateTeam', () => {
        it('성공', async () => {
            const dto = {
                order__createdAt: 'ASC' as 'ASC' | 'DESC',
                page: 1,
                take: 5,
            };
            let team1 = new TeamModel();
            const team2 = new TeamModel();
            const team3 = new TeamModel();
            const team4 = new TeamModel();
            const team5 = new TeamModel();
            team1.gender = Gender.Male;
            team2.gender = Gender.Male;
            team3.gender = Gender.Male;
            team4.gender = Gender.Female;
            team5.gender = Gender.Mixed;

            const mockReturn = {
                data: [team1, team2, team3],
                page: 1,
                total: 3,
            };

            jest.spyOn(repository, 'findAndCount').mockResolvedValue([[team1, team2, team3], 3]);
            const result = await service.paginateTeam(dto, Gender.Male);

            expect(result).toEqual(mockReturn);
        });
    });

    describe('createTeam 테스트', () => {
        // it('성공', async () => {
        //     const createTeamDto = {
        //         name: 'test',
        //         description: 'test description',
        //         gender: Gender.Male,
        //         isMixedGender: false,
        //         address: 'test address',
        //         state: 'test state',
        //         district: 'test district',
        //         city: 'test city',
        //         latitude: 37.5665,
        //         longitude: 126.978,
        //     };
        //     const userId = 1;
        //     const file = {
        //         fieldname: 'file',
        //         encoding: '7bit',
        //         mimetype: 'image/jpeg',
        //         size: 1024,
        //         originalname: 'test.jpg',
        //         stream: {},
        //         destination: 'test',
        //         filename: 'test.jpg',
        //         path: 'test',
        //         buffer: Buffer.from('test'),
        //     };
        //     const result = await service.createTeam(createTeamDto, userId, file);
        // });
    });

    describe('getTeamDetail 테스트', () => {
        it('성공_redisResult가 있는 경우', async () => {
            const teamId = 1;
            const mockTeam = {
                id: 1,
                name: 'test',
                description: 'test description',
            };

            jest.spyOn(redisService, 'getTeamDetail').mockResolvedValue(JSON.stringify(mockTeam));
            const result = await service.getTeamDetail(teamId);
            const mockReturn = mockTeam;
            expect(result).toEqual(mockReturn);
        });

        it('성공_redisResult가 없는 경우', async () => {
            const teamId = 1;
            jest.spyOn(redisService, 'getTeamDetail').mockResolvedValue(null);
            const mockTeam = new TeamModel();
            mockTeam.id = 1;
            mockTeam.name = 'test';
            mockTeam.description = 'test description';

            jest.spyOn(repository, 'findOne').mockResolvedValue(mockTeam);
            jest.spyOn(redisService, 'getTeamDetail').mockResolvedValue(JSON.stringify(mockTeam));
            const mockReturn = mockTeam;
            const result = await service.getTeamDetail(teamId);
            expect(result).toEqual(mockReturn);
        });
    });
});
