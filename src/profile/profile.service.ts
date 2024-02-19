import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Profile } from './entities/profile.entity';

import {
    FindManyOptions,
    QueryRunner,
    Repository,
    ILike,
    Like,
    IsNull,
    DataSource,
    Not,
} from 'typeorm';
import { User } from '../user/entities/user.entity';
import { UpdateProfileInfoDto } from './dtos/update-profile-info-dto';
import { LocationModel } from '../location/entities/location.entity';
import { Member } from '../member/entities/member.entity';
import { PaginateProfileDto } from './dtos/paginate-profile-dto';
import { CommonService } from '../common/common.service';
import { TeamController } from '../team/team.controller';
import { Gender } from '../enums/gender.enum';
import { AwsService } from '../aws/aws.service';
import { RegisterProfileInfoDto } from './dtos/register-profile-info-dto';
import { profile } from 'console';
import { InviteStatus } from 'src/enums/invite-status.enum';

@Injectable()
export class ProfileService {
    constructor(
        @InjectRepository(Profile)
        private readonly profileRepository: Repository<Profile>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Member)
        private readonly memberRepository: Repository<Member>,
        @InjectRepository(LocationModel)
        private readonly locationRepository: Repository<LocationModel>,
        private readonly commonService: CommonService,
        private readonly awsService: AwsService,
        private readonly dataSource: DataSource,
    ) {}

    async paginateMyProfile(userId: number, dto: PaginateProfileDto, name?: string) {
        const member = await this.memberRepository.findOne({ where: { user: { id: userId } } });
        if (member.isStaff != true) {
            return null;
        }

        const options: FindManyOptions<Profile> = {
            relations: { user: { member: { team: true } } },
        };

        if (name) {
            options.where = { user: { name: Like(`%${name}%`) } };
        }

        return await this.commonService.paginate(dto, this.profileRepository, options, 'profile');
    }

    async paginateProfile(
        dto: PaginateProfileDto,
        gender?: string,
        name?: string,
        region?: string,
    ) {
        const { page, take } = dto;

        let query = this.profileRepository
            .createQueryBuilder('profile')
            .leftJoinAndSelect('profile.user', 'user')
            .leftJoinAndSelect('user.member', 'member')
            .leftJoinAndSelect('profile.location', 'location')
            .leftJoinAndSelect('profile.receivedInvites', 'invite')
            .where('member.id IS NULL'); // 팀이 없는 사람들

        if (gender) {
            query = query.andWhere('profile.gender = :gender', { gender });
        }

        if (name) {
            query = query.andWhere('user.name LIKE :name', { name: `%${name}%` });
        }

        if (region) {
            query = query.andWhere('(location.state = :region OR location.city = :region)', {
                region,
            });
        }

        const totalCount = await query.getCount();

        const totalPages = Math.ceil(totalCount / take);

        const currentPageResults = await query
            .take(take)
            .skip((page - 1) * take)
            .getMany();
        return {
            total: totalCount,
            totalPages: totalPages,
            currentPage: page,
            data: currentPageResults,
        };
    }

    async searchProfile(name?: string) {
        const options: FindManyOptions<Profile> = {
            relations: { user: { member: { team: true } } },
        };

        if (name) {
            options.where = { user: { name: Like(`%${name}%`) } };
        }

        const data = await this.profileRepository.find(options);
        return data;
    }

    async findAllProfiles() {
        const profiles = await this.profileRepository.find({
            relations: { user: { member: { team: true } } },
        });

        if (!profiles || profiles.length === 0) {
            throw new NotFoundException('프로필을 찾을 수 없습니다.');
        }

        return profiles;
    }

    async findOneById(id: number): Promise<Profile | null> {
        const profile = await this.profileRepository.findOne({ where: { id } });

        return profile || null; // 프로필이 존재하지 않으면 null 반환
    }

    async findOneByUserId(id: number) {
        const user = await this.userRepository.findOne({ where: { id } });

        if (!user) {
            throw new NotFoundException('유저를 찾을 수 없습니다.');
        }

        return user;
    }

    async registerProfile(
        userId: number,
        registerProfileInfoDto: RegisterProfileInfoDto,
        file: Express.Multer.File,
    ): Promise<Profile> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const user = await this.userRepository.findOne({
                where: { id: userId },
                relations: ['profile'],
            });

            const location = await this.locationRepository.save({
                latitude: registerProfileInfoDto.latitude,
                longitude: registerProfileInfoDto.longitude,
                state: registerProfileInfoDto.state,
                city: registerProfileInfoDto.city,
                district: registerProfileInfoDto.district,
                address: registerProfileInfoDto.address,
            });

            if (!user) {
                throw new NotFoundException('User not found');
            }

            if (!user.profile) {
                user.profile = new Profile();
            }

            const imageUUID = await this.awsService.uploadFile(file);

            const registeredProfile = await this.profileRepository.save({
                ...registerProfileInfoDto,
                user: user,
                location: location,
                imageUUID: imageUUID,
            });

            await queryRunner.commitTransaction();
            return registeredProfile;
        } catch (err) {
            await queryRunner.rollbackTransaction();
        } finally {
            await queryRunner.release();
        }
    }

    async updateProfileInfo(
        userId: number,
        updateProfileInfoDto: UpdateProfileInfoDto,
        file?: Express.Multer.File,
    ): Promise<Profile> {
        try {
            // 사용자 및 해당 프로필 가져오기
            const user = await this.userRepository.findOne({
                where: { id: userId },
                relations: ['profile', 'profile.location'],
            });
            if (!user) {
                throw new NotFoundException('User not found');
            }
            if (!user.profile) {
                throw new NotFoundException('Profile not found');
            }

            const imageUUID = file ? await this.awsService.uploadFile(file) : null;

            // 프로필 정보 업데이트
            user.profile.preferredPosition = updateProfileInfoDto.preferredPosition;
            user.profile.weight = updateProfileInfoDto.weight;
            user.profile.height = updateProfileInfoDto.height;
            user.profile.age = updateProfileInfoDto.age;
            user.profile.gender = updateProfileInfoDto.gender;

            // 사용자 프로필의 location 속성 초기화 확인
            if (!user.profile.location) {
                user.profile.location = new LocationModel();
            }

            // 주소 및 위치 정보 업데이트
            user.profile.location.address = updateProfileInfoDto.address;
            user.profile.location.state = updateProfileInfoDto.state;
            user.profile.location.city = updateProfileInfoDto.city;
            user.profile.location.latitude = updateProfileInfoDto.latitude;
            user.profile.location.longitude = updateProfileInfoDto.longitude;
            user.profile.location.district = updateProfileInfoDto.district;

            // 파일이 제공되었다면 이미지 UUID 업데이트
            if (file) {
                user.profile.imageUUID = imageUUID;
            }

            // 업데이트된 프로필 저장
            const updatedProfile = await this.profileRepository.save(user.profile);

            return updatedProfile;
        } catch (error) {
            if (error instanceof NotFoundException) {
                if (error.message === 'User not found') {
                    throw new NotFoundException('User not found');
                }
                if (error.message === 'Profile not found') {
                    throw new NotFoundException('Profile not found');
                }
            } else {
                throw new Error('Failed to update profile info');
            }
        }
    }

    async deleteProfile(id: number) {
        const profile = await this.profileRepository.findOne({ where: { id } });

        if (!profile) {
            throw new NotFoundException('프로필을 찾을 수 없습니다.');
        }

        // 프로필 삭제
        await this.profileRepository.remove(profile);

        return profile;
    }

    /**
     * 유저id로 profile 조회
     * @param userId
     * @returns
     */
    async getProfileByUserId(userId: number) {
        const getProfile = await this.profileRepository.findOne({
            where: {
                user: {
                    id: userId,
                },
            },
        });

        return getProfile;
    }
}
