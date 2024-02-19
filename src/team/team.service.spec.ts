import { Test, TestingModule } from '@nestjs/testing';
import { TeamService } from './team.service';
import { Not, Repository, SelectQueryBuilder } from 'typeorm';
import { TeamModel } from './entities/team.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CommonService } from 'src/common/common.service';
import { AwsService } from 'src/aws/aws.service';
import { LocationService } from 'src/location/location.service';
import { MemberService } from 'src/member/member.service';
import { ChatsService } from 'src/chats/chats.service';
import { RedisService } from 'src/redis/redis.service';
import {
    BadRequestException,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import { Gender } from 'src/enums/gender.enum';
import { Member } from 'src/member/entities/member.entity';
import { LocationModel } from 'src/location/entities/location.entity';
import { Chats } from 'src/chats/entities/chats.entity';

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
                        update: jest.fn(),
                        findOneBy: jest.fn(),
                        softDelete: jest.fn(),
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
                        uploadFile: jest.fn(),
                    },
                },
                {
                    provide: RedisService,
                    useValue: {
                        getTeamDetail: jest.fn(),
                        setTeamDetail: jest.fn(),
                        delTeamDetail: jest.fn(),
                    },
                },
                {
                    provide: LocationService,
                    useValue: {
                        getLocation: jest.fn(),
                        extractAddress: jest.fn(),
                        findOneLocation: jest.fn(),
                        registerLocation: jest.fn(),
                    },
                },
                {
                    provide: MemberService,
                    useValue: {
                        createMember: jest.fn(),
                        getMemberCountByTeamId: jest.fn(),
                        registerCreatorMember: jest.fn(),
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
        memberService = module.get<MemberService>(MemberService);
        awsService = module.get<AwsService>(AwsService);
        chatsService = module.get<ChatsService>(ChatsService);
        locationService = module.get<LocationService>(LocationService);
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
        function MockFile() {}

        MockFile.prototype.create = function (name, size, mimeType) {
            name = name || 'mock.txt';
            size = size || 1024;
            mimeType = mimeType || 'plain/txt';

            function range(count) {
                var output = '';
                for (var i = 0; i < count; i++) {
                    output += 'a';
                }
                return output;
            }

            var blob = new Blob([range(size)], { type: mimeType });

            return blob;
        };

        it('성공', async () => {
            const createTeamDto = {
                name: 'test',
                description: 'test description',
                gender: Gender.Male,
                isMixedGender: false,
                address: 'test address',
                state: 'test state',
                district: 'test district',
                city: 'test city',
                latitude: 37.5665,
                longitude: 126.978,
            };
            const userId = 1;
            const file = new MockFile().create('test.jpg', 1024, 'image/jpeg');
            const expectTeam = new TeamModel();
            expectTeam.id = 1;
            expectTeam.name = 'test';
            expectTeam.description = 'test description';
            expectTeam.imageUUID = 'test URL';
            expectTeam.location = new LocationModel();

            jest.spyOn(repository, 'findOne').mockResolvedValue(null);
            jest.spyOn(repository, 'exists').mockResolvedValue(false);
            jest.spyOn(locationService, 'extractAddress').mockReturnValueOnce({
                state: 'test state',
                city: 'test city',
                district: 'test district',
            });
            jest.spyOn(locationService, 'findOneLocation').mockResolvedValue(null);
            jest.spyOn(locationService, 'registerLocation').mockResolvedValue(new LocationModel());
            jest.spyOn(awsService, 'uploadFile').mockResolvedValue('test URL');
            jest.spyOn(chatsService, 'createChat').mockResolvedValue(new Chats());
            jest.spyOn(repository, 'save').mockResolvedValue(expectTeam);
            jest.spyOn(memberService, 'registerCreatorMember').mockResolvedValue();
            const result = await service.createTeam(createTeamDto, userId, file);
            expect(result).toEqual(expectTeam);
        });
        it('성공_ location이 있는 경우 있는 경우', async () => {
            const createTeamDto = {
                name: 'test',
                description: 'test description',
                gender: Gender.Male,
                isMixedGender: false,
                address: 'test address',
                state: 'test state',
                district: 'test district',
                city: 'test city',
                latitude: 37.5665,
                longitude: 126.978,
            };
            const userId = 1;
            const file = new MockFile().create('test.jpg', 1024, 'image/jpeg');
            const expectTeam = new TeamModel();
            expectTeam.id = 1;
            expectTeam.name = 'test';
            expectTeam.description = 'test description';
            expectTeam.imageUUID = 'test URL';
            expectTeam.location = new LocationModel();

            jest.spyOn(repository, 'findOne').mockResolvedValue(null);
            jest.spyOn(repository, 'exists').mockResolvedValue(false);
            jest.spyOn(locationService, 'extractAddress').mockReturnValueOnce({
                state: 'test state',
                city: 'test city',
                district: 'test district',
            });
            jest.spyOn(locationService, 'findOneLocation').mockResolvedValue(new LocationModel());
            jest.spyOn(locationService, 'registerLocation').mockResolvedValue(new LocationModel());
            jest.spyOn(awsService, 'uploadFile').mockResolvedValue('test URL');
            jest.spyOn(chatsService, 'createChat').mockResolvedValue(new Chats());
            jest.spyOn(repository, 'save').mockResolvedValue(expectTeam);
            jest.spyOn(memberService, 'registerCreatorMember').mockResolvedValue();
            const result = await service.createTeam(createTeamDto, userId, file);
            expect(result).toEqual(expectTeam);
        });
        it('실패_ 팀 이름이 중복인 경우', async () => {
            const createTeamDto = {
                name: 'test',
                description: 'test description',
                gender: Gender.Male,
                isMixedGender: false,
                address: 'test address',
                state: 'test state',
                district: 'test district',
                city: 'test city',
                latitude: 37.5665,
                longitude: 126.978,
            };
            const userId = 1;
            const file = new MockFile().create('test.jpg', 1024, 'image/jpeg');
            const expectTeam = new TeamModel();
            expectTeam.id = 1;
            expectTeam.name = 'test';
            expectTeam.description = 'test description';
            expectTeam.imageUUID = 'test URL';
            expectTeam.location = new LocationModel();

            jest.spyOn(repository, 'findOne').mockResolvedValue(null);
            jest.spyOn(repository, 'exists').mockResolvedValue(true);
            jest.spyOn(locationService, 'extractAddress').mockReturnValueOnce({
                state: 'test state',
                city: 'test city',
                district: 'test district',
            });
            jest.spyOn(locationService, 'findOneLocation').mockResolvedValue(new LocationModel());
            jest.spyOn(locationService, 'registerLocation').mockResolvedValue(new LocationModel());
            jest.spyOn(awsService, 'uploadFile').mockResolvedValue('test URL');
            jest.spyOn(chatsService, 'createChat').mockResolvedValue(new Chats());
            jest.spyOn(repository, 'save').mockResolvedValue(expectTeam);
            jest.spyOn(memberService, 'registerCreatorMember').mockResolvedValue();
            expect(
                async () => await service.createTeam(createTeamDto, userId, file),
            ).rejects.toThrow(new BadRequestException('이미 중복된 팀이름이 존재합니다.'));
        });

        it('실패_ 팀 이름이 중복인 경우', async () => {
            const createTeamDto = {
                name: 'test',
                description: 'test description',
                gender: Gender.Male,
                isMixedGender: false,
                address: 'test address',
                state: 'test state',
                district: 'test district',
                city: 'test city',
                latitude: 37.5665,
                longitude: 126.978,
            };
            const userId = 1;
            const file = new MockFile().create('test.jpg', 1024, 'image/jpeg');
            const expectTeam = new TeamModel();
            expectTeam.id = 1;
            expectTeam.name = 'test';
            expectTeam.description = 'test description';
            expectTeam.imageUUID = 'test URL';
            expectTeam.location = new LocationModel();

            jest.spyOn(repository, 'findOne').mockResolvedValue(new TeamModel());
            jest.spyOn(repository, 'exists').mockResolvedValue(true);
            jest.spyOn(locationService, 'extractAddress').mockReturnValueOnce({
                state: 'test state',
                city: 'test city',
                district: 'test district',
            });
            jest.spyOn(locationService, 'findOneLocation').mockResolvedValue(new LocationModel());
            jest.spyOn(locationService, 'registerLocation').mockResolvedValue(new LocationModel());
            jest.spyOn(awsService, 'uploadFile').mockResolvedValue('test URL');
            jest.spyOn(chatsService, 'createChat').mockResolvedValue(new Chats());
            jest.spyOn(repository, 'save').mockResolvedValue(expectTeam);
            jest.spyOn(memberService, 'registerCreatorMember').mockResolvedValue();
            expect(
                async () => await service.createTeam(createTeamDto, userId, file),
            ).rejects.toThrow(new BadRequestException('이미 해당 사용자는 팀을 가지고 있습니다.'));
        });

        it('InternalServerErrorException 테스트', async () => {
            const createTeamDto = {
                name: 'test',
                description: 'test description',
                gender: Gender.Male,
                isMixedGender: false,
                address: 'test address',
                state: 'test state',
                district: 'test district',
                city: 'test city',
                latitude: 37.5665,
                longitude: 126.978,
            };
            const userId = 1;
            const file = new MockFile().create('test.jpg', 1024, 'image/jpeg');
            const expectTeam = new TeamModel();
            expectTeam.id = 1;
            expectTeam.name = 'test';
            expectTeam.description = 'test description';
            expectTeam.imageUUID = 'test URL';
            expectTeam.location = new LocationModel();

            jest.spyOn(repository, 'findOne').mockResolvedValue(null);
            jest.spyOn(repository, 'exists').mockResolvedValue(false);
            jest.spyOn(locationService, 'extractAddress').mockReturnValueOnce({
                state: 'test state',
                city: 'test city',
                district: 'test district',
            });
            jest.spyOn(locationService, 'findOneLocation').mockResolvedValue(new LocationModel());
            jest.spyOn(locationService, 'registerLocation').mockResolvedValue(new LocationModel());
            jest.spyOn(awsService, 'uploadFile').mockResolvedValue('test URL');
            jest.spyOn(chatsService, 'createChat').mockResolvedValue(new Chats());
            jest.spyOn(repository, 'save').mockResolvedValue(expectTeam);
            const error = new Error('Database connection lost');
            jest.spyOn(memberService, 'registerCreatorMember').mockRejectedValue(error);

            await expect(service.createTeam(createTeamDto, userId, file)).rejects.toThrow(
                InternalServerErrorException,
            );
        });
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

    describe('getTeamInfo 테스트', () => {
        it('성공', async () => {
            const teamId = 1;
            const mockTeam = new TeamModel();
            mockTeam.id = 1;

            jest.spyOn(repository, 'findOne').mockResolvedValue(mockTeam);
            const result = await service.getTeamInfo(teamId);

            expect(result).toEqual(mockTeam);
        });

        it('실패 _ 에러 테스트', async () => {
            const teamId = 1;
            jest.spyOn(repository, 'findOne').mockRejectedValue(new Error());

            // `getTeamInfo` 함수가 예외를 던지는지 확인.
            await expect(service.getTeamInfo(teamId)).rejects.toThrow(Error);

            console.error = jest.fn();
            console.error('Error while getting team info:', expect.any(Error));

            expect(console.error).toHaveBeenCalledWith(
                'Error while getting team info:',
                expect.any(Error),
            );
        });

        it('실패 _ team이 없는 경우', async () => {
            const teamId = 1;
            jest.spyOn(repository, 'findOne').mockResolvedValue(null);
            expect(async () => await service.getTeamInfo(teamId)).rejects.toThrow(
                new NotFoundException('팀을 찾을 수 없습니다.'),
            );
        });
    });

    describe('getTeams 테스트', () => {
        it('성공', async () => {
            const mockTeams = [new TeamModel(), new TeamModel()];
            mockTeams[0].id = 1;
            mockTeams[0].location = new LocationModel();
            mockTeams[1].id = 2;
            mockTeams[1].location = new LocationModel();

            jest.spyOn(repository, 'find').mockResolvedValue(mockTeams);
            jest.spyOn(memberService, 'getMemberCountByTeamId').mockImplementation(
                async (teamId) => {
                    return [undefined, 2];
                },
            );

            const result = await service.getTeams();

            const expectedReturn = mockTeams.map((team) => ({
                team: {
                    ...team,
                    location: team.location,
                },
                totalMember: 2,
            }));

            expect(result).toEqual(expectedReturn);
        });
    });

    describe('getTeam 테스트', () => {
        it('성공', async () => {
            const paginateDto = {
                order__createdAt: 'ASC' as 'ASC' | 'DESC',
                page: 1,
                take: 10,
            };
            const mockTeams = [new TeamModel(), new TeamModel()];

            mockTeams[0].id = 1;
            mockTeams[0].location = new LocationModel();
            mockTeams[1].id = 2;
            mockTeams[1].location = new LocationModel();

            const mockMemberCounts = [
                [undefined, 2],
                [undefined, 2],
            ];

            const mockQueryBuilder: Partial<SelectQueryBuilder<TeamModel>> = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                getManyAndCount: jest.fn().mockResolvedValue([mockTeams, mockTeams.length]),
            };

            jest.spyOn(repository, 'createQueryBuilder').mockReturnValue(
                mockQueryBuilder as SelectQueryBuilder<TeamModel>,
            );

            jest.spyOn(memberService, 'getMemberCountByTeamId').mockImplementation(
                async (teamId) => {
                    return [undefined, 2];
                },
            );
            const result = await service.getTeam(paginateDto, 'Team', true, 'Region', 'Gender');

            expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
                'team.location',
                'location',
            );
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(4); // This should match the number of times 'andWhere' is called in the actual method
            expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
            expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
            expect(mockQueryBuilder.getManyAndCount).toHaveBeenCalled();

            const expectedTeamsWithCounts = mockTeams.map((team, index) => ({
                team: {
                    ...team,
                    location: team.location,
                },
                totalMember: mockMemberCounts[index][1],
            }));
            expect(result).toEqual({ data: expectedTeamsWithCounts, total: mockTeams.length });
        });
    });

    describe('updateTeam', () => {
        function MockFile() {}

        MockFile.prototype.create = function (name, size, mimeType) {
            name = name || 'mock.txt';
            size = size || 1024;
            mimeType = mimeType || 'plain/txt';

            function range(count) {
                var output = '';
                for (var i = 0; i < count; i++) {
                    output += 'a';
                }
                return output;
            }

            var blob = new Blob([range(size)], { type: mimeType });

            return blob;
        };

        it('성공_file 없는 경우', async () => {
            const teamId = 1;
            const updateTeamDto = {
                latitude: 37.5665,
                longitude: 126.978,
                imageUUID: 'test UUID',
                location: new LocationModel(),
            };

            const mockTeam = new TeamModel();
            mockTeam.id = teamId;
            mockTeam.location = new LocationModel();
            mockTeam.location.latitude = 37.5665;
            mockTeam.location.longitude = 126.978;
            mockTeam.imageUUID = 'test UUID';
            jest.spyOn(repository, 'update').mockResolvedValue(
                // @ts-ignore
                { raw: [mockTeam] },
            );
            jest.spyOn(redisService, 'delTeamDetail').mockResolvedValue(null);
            const result = await service.updateTeam(teamId, updateTeamDto, null);
            expect(result).toEqual(undefined);
        });

        it('성공_file 있는 경우', async () => {
            const teamId = 1;
            const updateTeamDto = {
                latitude: 37.5665,
                longitude: 126.978,
                imageUUID: 'test UUID',
                location: new LocationModel(),
            };

            const file = new MockFile().create('test.jpg', 1024, 'image/jpeg');

            const mockTeam = new TeamModel();
            mockTeam.id = teamId;
            mockTeam.location = new LocationModel();
            mockTeam.location.latitude = 37.5665;
            mockTeam.location.longitude = 126.978;
            mockTeam.imageUUID = 'test UUID';

            jest.spyOn(repository, 'update').mockResolvedValue(
                // @ts-ignore
                { raw: [mockTeam] },
            );
            jest.spyOn(redisService, 'delTeamDetail').mockResolvedValue(null);
            jest.spyOn(awsService, 'uploadFile').mockResolvedValue('test URL');

            const result = await service.updateTeam(teamId, updateTeamDto, file);
            expect(result).toEqual(undefined);
        });

        // it('에러 테스트', async () => {});
    });

    describe('deleteTeam', () => {
        it('성공', async () => {
            const teamId = 1;
            const mockTeam = new TeamModel();
            mockTeam.id = teamId;

            jest.spyOn(repository, 'findOneBy').mockResolvedValue(mockTeam);
            const result = await service.deleteTeam(teamId);

            expect(result).toEqual(`팀 ID ${teamId}가 삭제되었습니다.`);
        });

        it('실패 _ team이 없는 경우', async () => {
            const teamId = 1;
            jest.spyOn(repository, 'findOneBy').mockResolvedValue(null);
            expect(async () => await service.deleteTeam(teamId)).rejects.toThrow(
                new NotFoundException(`팀 ID ${teamId}를 찾을 수 없습니다.`),
            );
        });
    });
});
