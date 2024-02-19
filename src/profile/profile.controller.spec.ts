import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { faker } from '@faker-js/faker';
import { ProfileService } from './profile.service';
import { AppModule } from '../app.module';
import { ProfileController } from './profile.controller';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PaginateProfileDto } from './dtos/paginate-profile-dto';
import { Profile } from './entities/profile.entity';
import { Gender } from 'src/enums/gender.enum';

enum Position {
    Goalkeeper = 'Goalkeeper',
    CenterBack = 'Center Back',
    RightBack = 'Right Back',
    LeftBack = 'Left Back',
    DefensiveMidfielder = 'Defensive Midfielder',
    CentralMidfielder = 'Central Midfielder',
    AttackingMidfielder = 'Attacking Midfielder',
    Striker = 'Striker',
    Forward = 'Forward',
    RightWinger = 'Right Winger',
    LeftWinger = 'Left Winger',
}

function getRandomPosition(): Position {
    const positions = Object.values(Position);
    const randomIndex = Math.floor(Math.random() * positions.length);
    return positions[randomIndex];
}

describe('ProfileController ', () => {
    let controller: ProfileController;
    let service: ProfileService;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ProfileController],
            providers: [
                {
                    provide: ProfileService,
                    useValue: {
                        paginateMyProfile: jest.fn(),
                        paginateProfile: jest.fn(),
                        findOneById: jest.fn(),
                        registerprofile: jest.fn(),
                    },
                },
            ],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({
                canActivate: () => true,
            })
            .compile();
        controller = module.get<ProfileController>(ProfileController);
        service = module.get<ProfileService>(ProfileService);
    });

    describe('/profile', () => {
        it('/profile (GET) - should get all profiles', async () => {
            const dto = new PaginateProfileDto();
            dto.name = 'test';
            const req = {
                user: {
                    id: 1,
                },
            };
            const profile = new Profile();
            const mockReturn = {
                data: [profile],
                cursor: {
                    after: 30,
                },
                count: 0,
                next: 'http://localhost:3001/api/profile?take=30&where__id__more_than=30',
            };
            jest.spyOn(service, 'paginateMyProfile').mockResolvedValue(mockReturn);
            const result = await controller.findAllProfiles(req, dto);
            expect(result).toEqual({
                statusCode: HttpStatus.OK,
                message: '전체 프로필 정보 조회에 성공했습니다.',
                data: mockReturn,
            });

            expect(service.paginateMyProfile).toHaveBeenCalledWith(req.user.id, dto, dto.name);
        });
    });

    describe('profiles without teams', () => {
        it('/profile/available (GET)', async () => {
            const dto = new PaginateProfileDto();
            dto.name = 'test';
            dto.gender = Gender.Male;
            dto.region = '서울';
            const req = {
                user: {
                    id: 1,
                },
            };

            const profile = new Profile();
            const mockReturn = {
                total: 0,
                totalPages: 0,
                currentPage: 0,
                data: [profile],
            };

            jest.spyOn(service, 'paginateProfile').mockResolvedValue(mockReturn);
            const result = await controller.findAvailableProfiles(req, dto);
            expect(result).toEqual({
                statusCode: HttpStatus.OK,
                message: '팀없는 프로필 정보 조회에 성공했습니다.',
                data: mockReturn,
            });
        });
    });

    describe('get profile with Id', () => {
        it('/profile/:profileId (GET)', async () => {
            const profileId = 1;
            const profile = new Profile();
            const mockReturn = {
                statusCode: HttpStatus.OK,
                message: '프로필 정보 조회에 성공했습니다.',
                data: profile,
            };
            jest.spyOn(service, 'findOneById').mockResolvedValue(profile);
            const result = await controller.findMe(profileId);
            expect(result).toEqual(mockReturn);
            expect(service.findOneById).toHaveBeenCalledWith(1);
        });
    });

    describe('create a profile', () => {
        it('/profile (POST)', async () => {
            const mockFile = {} as Express.Multer.File;
            const req = {
                user: {
                    id: 1,
                },
            };
            const dto = {};
            const profile = new Profile();
            const mockReturn = {
                statusCode: HttpStatus.OK,
                message: '프로필 등록에 성공했습니다.',
                data: profile,
            };
            service.registerProfile = jest.fn().mockResolvedValue(profile);
            const result = await controller.registerprofile(req, dto, mockFile);
            expect(result).toEqual(mockReturn);
            expect(service.registerProfile).toHaveBeenCalledWith(req.user.id, dto, mockFile);
        });
    });

    describe('modifying profile', () => {
        it('/profile/:profileId (PUT)', async () => {
            const mockFile = {} as Express.Multer.File;
            const req = {
                user: {
                    id: 1,
                },
            };
            const dto = {};
            const profile = new Profile();
            const mockReturn = {
                statusCode: HttpStatus.OK,
                message: '프로필 정보 수정에 성공했습니다.',
                data: profile,
            };
            service.updateProfileInfo = jest.fn().mockResolvedValue(profile);
            const result = await controller.updateprofileInfo(req, dto, mockFile);
            expect(result).toEqual(mockReturn);
            expect(service.updateProfileInfo).toHaveBeenCalledWith(req.user.id, dto, mockFile);
        });
    });
});
