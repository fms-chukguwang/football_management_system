import { NotFoundException } from '@nestjs/common/exceptions';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ProfileService } from './profile.service';
import { Profile } from './entities/profile.entity';
import { PaginateProfileDto } from './dtos/paginate-profile-dto';
import { User } from 'src/user/entities/user.entity';
import { Member } from 'src/member/entities/member.entity';
import { LocationModel } from 'src/location/entities/location.entity';
import { TeamModel } from 'src/team/entities/team.entity';
import { Gender } from 'src/enums/gender.enum';
import { CommonService } from 'src/common/common.service';
import { AwsService } from 'src/aws/aws.service';
import { ConfigService } from '@nestjs/config';
import { RedisService } from 'src/redis/redis.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

describe('ProfileService', () => {
    let service: ProfileService;
    let profileRepository: Repository<Profile>;
    let userRepository: Repository<User>;
    let memberRepository: Repository<Member>;
    let locationRepository: Repository<LocationModel>;
    let redisService: RedisService;
    let awsService: AwsService;
    let commonService: CommonService;

    beforeEach(async () => {
        const mockDataSource = {
            getConnection: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProfileService,
                AwsService,
                ConfigService,
                {
                    provide: DataSource,
                    useValue: mockDataSource,
                },
                {
                    provide: AwsService,
                    useValue: {
                        uploadFile: jest.fn(),
                        deleteFile: jest.fn(),
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
                    provide: CommonService,
                    useValue: {
                        paginate: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(Profile),
                    useValue: {
                        createQueryBuilder: jest.fn(),
                        find: jest.fn(),
                        findOne: jest.fn(),
                        remove: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(User),
                    useValue: {
                        findOne: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(Member),
                    useClass: Repository,
                },
                {
                    provide: getRepositoryToken(LocationModel),
                    useClass: Repository,
                },
            ],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({
                canActivate: jest.fn().mockReturnValue(true),
            })
            .compile();

        service = module.get<ProfileService>(ProfileService);
        commonService = module.get<CommonService>(CommonService);
        redisService = module.get<RedisService>(RedisService);
        profileRepository = module.get<Repository<Profile>>(getRepositoryToken(Profile));
        userRepository = module.get<Repository<User>>(getRepositoryToken(User));
        memberRepository = module.get<Repository<Member>>(getRepositoryToken(Member));
        locationRepository = module.get<Repository<LocationModel>>(
            getRepositoryToken(LocationModel),
        );
    });

    describe('paginateMyProfile', () => {
        it('should return null if the user is not a staff member', async () => {
            const userId = 1;
            const dto = new PaginateProfileDto();
            const member = new Member();
            member.isStaff = false;
            jest.spyOn(memberRepository, 'findOne').mockResolvedValue(member);
            const result = await service.paginateMyProfile(userId, dto);
            expect(result).toBeNull();
        });

        it('should return a paginated profile', async () => {
            const userId = 1;
            const dto = new PaginateProfileDto();
            const member = new Member();
            member.isStaff = true;
            jest.spyOn(memberRepository, 'findOne').mockResolvedValue(member);
            jest.spyOn(commonService, 'paginate').mockResolvedValue({ data: [], total: 1 });
            const result = await service.paginateMyProfile(userId, dto);
            expect(result).toEqual({ data: [], total: 1 });
        });

        it('should return a paginated profile with a name filter', async () => {
            const userId = 1;
            const dto = new PaginateProfileDto();
            const name = 'test';
            const member = new Member();
            member.isStaff = true;
            jest.spyOn(memberRepository, 'findOne').mockResolvedValue(member);
            jest.spyOn(commonService, 'paginate').mockResolvedValue({ data: [], total: 1 });
            const result = await service.paginateMyProfile(userId, dto, name);
            expect(result).toEqual({ data: [], total: 1 });
        });
    });

    describe('paginateProfile', () => {
        it('성공', async () => {
            const dto = new PaginateProfileDto();
            const gender = Gender.Male;
            const name = 'test';
            const region = 'test';
            dto.page = 1;
            dto.take = 10;
            const mockQueryBuilder = {
                andWhere: jest.fn().mockReturnThis(),
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                getCount: jest.fn().mockResolvedValue(0),
                getMany: jest.fn().mockResolvedValue([]),
            };
            jest.spyOn(profileRepository, 'createQueryBuilder').mockReturnValue(
                mockQueryBuilder as any,
            );
            const mockReturn = {
                total: 0,
                totalPages: 0,
                currentPage: 1,
                data: [],
            };
            const result = await service.paginateProfile(dto);
            expect(result).toEqual(mockReturn);
            expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('profile.user', 'user');
            expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
                'user.member',
                'member',
            );
            expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
                'profile.location',
                'location',
            );
            expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
                'profile.receivedInvites',
                'invite',
            );
            expect(mockQueryBuilder.where).toHaveBeenCalledWith('member.id IS NULL');
        });

        it('성공 _ gender 있는 경우', async () => {
            const dto = new PaginateProfileDto();
            const gender = Gender.Male;
            const name = 'test';
            const region = 'test';
            dto.page = 1;
            dto.take = 10;
            const mockQueryBuilder = {
                andWhere: jest.fn().mockReturnThis(),
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                getCount: jest.fn().mockResolvedValue(0),
                getMany: jest.fn().mockResolvedValue([]),
            };
            jest.spyOn(profileRepository, 'createQueryBuilder').mockReturnValue(
                mockQueryBuilder as any,
            );
            const mockReturn = {
                total: 0,
                totalPages: 0,
                currentPage: 1,
                data: [],
            };
            const result = await service.paginateProfile(dto, gender);
            expect(result).toEqual(mockReturn);
            expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('profile.user', 'user');
            expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
                'user.member',
                'member',
            );
            expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
                'profile.location',
                'location',
            );
            expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
                'profile.receivedInvites',
                'invite',
            );
            expect(mockQueryBuilder.where).toHaveBeenCalledWith('member.id IS NULL');
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('profile.gender = :gender', {
                gender,
            });
        });

        it('성공 _ gender, name 있는 경우', async () => {
            const dto = new PaginateProfileDto();
            const gender = Gender.Male;
            const name = 'test';
            const region = 'test';
            dto.page = 1;
            dto.take = 10;
            const mockQueryBuilder = {
                andWhere: jest.fn().mockReturnThis(),
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                getCount: jest.fn().mockResolvedValue(0),
                getMany: jest.fn().mockResolvedValue([]),
            };
            jest.spyOn(profileRepository, 'createQueryBuilder').mockReturnValue(
                mockQueryBuilder as any,
            );
            const mockReturn = {
                total: 0,
                totalPages: 0,
                currentPage: 1,
                data: [],
            };
            const result = await service.paginateProfile(dto, gender, name);
            expect(result).toEqual(mockReturn);
            expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('profile.user', 'user');
            expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
                'user.member',
                'member',
            );
            expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
                'profile.location',
                'location',
            );
            expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
                'profile.receivedInvites',
                'invite',
            );
            expect(mockQueryBuilder.where).toHaveBeenCalledWith('member.id IS NULL');
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('profile.gender = :gender', {
                gender,
            });
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('user.name LIKE :name', {
                name: `%${name}%`,
            });
        });
        it('성공 _ gender, name, region 있는 경우', async () => {
            const dto = new PaginateProfileDto();
            const gender = Gender.Male;
            const name = 'test';
            const region = 'test';
            dto.page = 1;
            dto.take = 10;
            const mockQueryBuilder = {
                andWhere: jest.fn().mockReturnThis(),
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                getCount: jest.fn().mockResolvedValue(0),
                getMany: jest.fn().mockResolvedValue([]),
            };
            jest.spyOn(profileRepository, 'createQueryBuilder').mockReturnValue(
                mockQueryBuilder as any,
            );
            const mockReturn = {
                total: 0,
                totalPages: 0,
                currentPage: 1,
                data: [],
            };
            const result = await service.paginateProfile(dto, gender, name, region);
            expect(result).toEqual(mockReturn);
            expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('profile.user', 'user');
            expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
                'user.member',
                'member',
            );
            expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
                'profile.location',
                'location',
            );
            expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
                'profile.receivedInvites',
                'invite',
            );
            expect(mockQueryBuilder.where).toHaveBeenCalledWith('member.id IS NULL');
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('profile.gender = :gender', {
                gender,
            });
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('user.name LIKE :name', {
                name: `%${name}%`,
            });

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                '(location.state = :region OR location.city = :region)',
                {
                    region,
                },
            );
        });
    });

    describe('searchProfile', () => {
        it('성공_name 있는 경우', async () => {
            const name = 'test';
            const mockReturn = [];
            jest.spyOn(profileRepository, 'find').mockResolvedValue(mockReturn);
            const result = await service.searchProfile(name);
            expect(result).toEqual(mockReturn);
            expect(profileRepository.find).toHaveBeenCalledWith({
                relations: { user: { member: { team: true } } },
                where: { user: { name: expect.any(Object) } },
            });
        });

        it('성공_name 없는 경우', async () => {
            const mockReturn = [];
            jest.spyOn(profileRepository, 'find').mockResolvedValue(mockReturn);
            const result = await service.searchProfile();
            expect(result).toEqual(mockReturn);
            expect(profileRepository.find).toHaveBeenCalledWith({
                relations: { user: { member: { team: true } } },
            });
            expect(profileRepository.find).toHaveBeenCalledWith({
                relations: { user: { member: { team: true } } },
            });
        });
    });

    describe('findAllProfiles', () => {
        it('성공', async () => {
            const mockReturn = [new Profile()];
            jest.spyOn(profileRepository, 'find').mockResolvedValue(mockReturn);
            const result = await service.findAllProfiles();
            expect(result).toEqual(mockReturn);
            expect(profileRepository.find).toHaveBeenCalledWith({
                relations: { user: { member: { team: true } } },
            });
        });

        it('성공 _ profile 없는 경우', async () => {
            const mockReturn = [];
            jest.spyOn(profileRepository, 'find').mockResolvedValue(mockReturn);

            await expect(service.findAllProfiles()).rejects.toThrow(NotFoundException);

            expect(profileRepository.find).toHaveBeenCalledWith({
                relations: { user: { member: { team: true } } },
            });
        });
    });

    describe('findOneById', () => {
        it('성공 _ profile 있는 경우', async () => {
            const mockReturn = new Profile();
            jest.spyOn(profileRepository, 'findOne').mockResolvedValue(mockReturn);
            const result = await service.findOneById(1);
            expect(result).toEqual(mockReturn);
            expect(profileRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
        });

        it('성공 _ profile 없는 경우', async () => {
            const id = 1;
            jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
            await expect(service.findOneByUserId(id)).rejects.toThrow(NotFoundException);
        });
    });

    describe('deleteProfile', () => {
        it('성공', async () => {
            const id = 1;
            const mockReturn = new Profile();
            jest.spyOn(profileRepository, 'findOne').mockResolvedValue(mockReturn);
            jest.spyOn(profileRepository, 'remove').mockResolvedValue(mockReturn);
            const result = await service.deleteProfile(id);
            expect(result).toEqual(mockReturn);
            expect(profileRepository.findOne).toHaveBeenCalledWith({ where: { id } });
        });

        it('profile 없는 경우', async () => {
            const id = 1;
            jest.spyOn(profileRepository, 'findOne').mockResolvedValue(null);
            await expect(service.deleteProfile(id)).rejects.toThrow(NotFoundException);
        });
    });

    describe('getProfileByUserId', () => {
        it('성공', async () => {
            const userId = 1;
            const mockReturn = new Profile();
            jest.spyOn(profileRepository, 'findOne').mockResolvedValue(mockReturn);
            const result = await service.getProfileByUserId(userId);
            expect(result).toEqual(mockReturn);
            expect(profileRepository.findOne).toHaveBeenCalledWith({
                where: {
                    user: {
                        id: userId,
                    },
                },
            });
        });
    });
});
