import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Profile } from './entities/profile.entity';
import { FindManyOptions, QueryRunner, Repository, ILike, Like, IsNull, DataSource } from 'typeorm';
import { RegisterProfileInfoDto } from './dtos/register-profile-info';
import { User } from '../user/entities/user.entity';
import { UpdateProfileInfoDto } from './dtos/update-profile-info-dto';
import { LocationModel } from '../location/entities/location.entity';
import { Member } from '../member/entities/member.entity';
import { PaginateProfileDto } from './dtos/paginate-profile-dto';
import { CommonService } from '../common/common.service';
import { TeamController } from '../team/team.controller';
import { Gender } from '../enums/gender.enum';
import { AwsService } from '../aws/aws.service';

@Injectable()
export class ProfileService {
    constructor(
        @InjectRepository(Profile)
        private readonly profileRepository: Repository<Profile>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Member)
        private readonly memberRepository: Repository<Member>,
        private readonly commonService: CommonService,
        private readonly awsService: AwsService,
        private readonly dataSource: DataSource,
    ) {}

    //   async getTeamNameByUserId(userId: string): Promise<string | null> {
    //     const profile = await this.profileRepository.findOne({ where: { user_id: userId } });
    //     return profile ? profile.team_name : null;
    //   }

    async paginateMyProfile(userId: number, dto: PaginateProfileDto, name?: string) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        const profile = await this.profileRepository.findOne({ where: { user: { id: userId } } });
        const member = await this.memberRepository.findOne({ where: { user: { id: userId } } });
        console.log('user=', user);
        console.log('profile=', profile);
        console.log('member=', member);
        if (member.isStaff != true) {
            return null;
        }

        const options: FindManyOptions<Profile> = {
            relations: { user: { member: { team: true } } },
        };

        if (name) {
            options.where = { user: { name: Like(`%${name}%`) } };
        }

        const data = await this.profileRepository.find(options);

        return await this.commonService.paginate(dto, this.profileRepository, options, 'profile');
    }

    async paginateProfile(userId: number, dto: PaginateProfileDto, name?: string) {
        try {
            const user = await this.userRepository.findOne({
                where: { id: userId },
                relations: ['team'],
            });

            console.log('uesr=', user);
            if (!user || !user.team) {
                throw new Error('User or team not found');
            }

            // 팀이 혼성이 아니라면 동일한 성별의 프로필들만 보여줌
            const mixedGenderTeam = user.team.isMixedGender;
            let options: FindManyOptions<Profile>;

            if (!mixedGenderTeam) {
                options = {
                    relations: { user: { member: { team: true } } },
                    where: {
                        user: {
                            profile: {
                                gender: user.team.gender, // 팀의 성별을 기준으로 검색
                            },
                            member: {
                                team: IsNull(),
                            },
                        },
                    },
                };
            } else {
                // 혼성 팀이면 모든 프로필 허용
                options = {
                    relations: { user: { member: { team: true } } },
                    where: {
                        user: {
                            member: {
                                team: IsNull(),
                            },
                        },
                    },
                };
            }

            if (name) {
                options.where = { user: { name: Like(`%${name}%`) } };
            }

            const data = await this.profileRepository.find(options);

            return await this.commonService.paginate(
                dto,
                this.profileRepository,
                options,
                'profile',
            );
        } catch (error) {
            console.error('Error in paginateProfile:', error);
            throw new Error('Error in paginateProfile');
        }
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

    async findOneById(id: number) {
        const profile = await this.profileRepository.findOne({ where: { id } });

        if (!profile) {
            throw new NotFoundException('프로필을 찾을 수 없습니다.');
        }

        return profile;
    }

    async findOneByUserId(id: number) {
        const user = await this.userRepository.findOne({ where: { id } });

        if (!user) {
            throw new NotFoundException('유저를 찾을 수 없습니다.');
        }

        return user;
    }

    async findOneByName(name: string): Promise<Profile | null> {
        const profile = await this.profileRepository.findOne({ where: { name } });

        if (!profile) {
            throw new NotFoundException(`이름을 찾을 수 없습니다.`);
        }

        return profile;
    }

    getProfileRepository(qr?: QueryRunner) {
        return qr ? qr.manager.getRepository<Profile>(Profile) : this.profileRepository;
    }

    getUserRepository(qr?: QueryRunner) {
        return qr ? qr.manager.getRepository<User>(User) : this.userRepository;
    }

    getMemberRepository(qr?: QueryRunner) {
        return qr ? qr.manager.getRepository<Member>(Member) : this.memberRepository;
    }

    async registerProfile(
        userId: number,
        registerProfileInfoDto: RegisterProfileInfoDto,
        file: Express.Multer.File,
    ): Promise<Profile> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();

        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['profile'],
        });

        const member = await this.memberRepository.findOne({
            where: { user: { id: userId } },
            relations: ['profile'],
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (!user.profile) {
            user.profile = new Profile();
        }

        try {
            await queryRunner.startTransaction();
            const imageUUID = await this.awsService.uploadFile(file);

            const registeredProfile = await this.profileRepository.save({
                ...registerProfileInfoDto,
                name: user.name,
                user,
                member,
                imageUUID,
            });
            // const registeredProfile = await profileRepository.save(user.profile);
            // throw new Error('Method not implemented.');
            await this.userRepository.save({ ...user, profile: registeredProfile });

            await queryRunner.commitTransaction();
            return registeredProfile;
        } catch (err) {
            console.log(err);
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
            console.log('Update Profile Info - UserId:', userId);
            console.log('Update Profile Info DTO:', updateProfileInfoDto);

            // Fetch the user along with the profile
            const user = await this.userRepository.findOne({
                where: { id: userId },
                relations: ['profile'],
            });

            if (!user) {
                throw new NotFoundException('User not found');
            }

            if (!user.profile) {
                user.profile = await this.profileRepository.findOne({
                    where: { user: { id: userId } },
                });

                if (!user.profile) {
                    throw new NotFoundException('Profile not found');
                }
            }

            const imageUUID = await this.awsService.uploadFile(file);

            const updatedProfile = await this.profileRepository.save({
                ...user.profile,
                ...updateProfileInfoDto,
                imageUUID,
            });

            console.log('Updated Profile:', updatedProfile);

            return updatedProfile;
        } catch (error) {
            console.error('Error updating profile info:', error.message);
            throw new Error('Failed to update profile info');
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
