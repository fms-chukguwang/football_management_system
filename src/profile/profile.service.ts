import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Profile } from './entities/profile.entity';
import { FindManyOptions, QueryRunner, Repository, ILike, Like, IsNull, DataSource, Not } from 'typeorm';
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

    async paginateProfile(userId: number, dto: PaginateProfileDto, gender?: string, name?: string) {
        try {
            // 멤버 아이디가 없는 모든 사용자들의 프로필을 가져오는 쿼리 설정
            let options: FindManyOptions<Profile> = {
                relations: ['user', 'user.member'], // 사용자와 멤버의 관계 설정
                where: {
                    user: {
                        member: IsNull(), // 멤버 아이디가 없는 사용자들만 가져오기
                    }
                },
            };
    
            // 성별 필터가 제공된 경우
            if (gender) {
                options.where['gender'] = gender;
            }
    
            // 이름 검색이 제공된 경우
            if (name) {
                options.where['name'] = Like(`%${name}%`);
            }
    
            // 프로필 데이터를 가져오기
            const data = await this.profileRepository.find(options);
    
            // 페이지네이션 서비스를 사용하여 결과를 반환
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

    // async findOneByName(name: string): Promise<Profile | null> {
    //     const profile = await this.profileRepository.findOne({ where: { name } });

    //     if (!profile) {
    //         return null;
    //     }

    //     return profile;
    // }

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
        
        try {

            const user = await this.userRepository.findOne({
                where: { id: userId },
                relations: ['profile'],
            });
        
            const member = await this.memberRepository.findOne({
                where: { user: { id: userId } },
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

            await queryRunner.startTransaction();
            const imageUUID = await this.awsService.uploadFile(file);

            const registeredProfile = await this.profileRepository.save({
                ...registerProfileInfoDto,
                user: user,
                member: member,
                location: location,
                imageUUID: imageUUID,
            });
    
            //user.profile = registeredProfile; 
    
            //await this.userRepository.save(user); 
    
            await queryRunner.commitTransaction();
            return registeredProfile;
        } catch (err) {
            console.log(err);
            await queryRunner.rollbackTransaction();
            throw new Error('Failed to register profile');
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
