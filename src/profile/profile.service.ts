import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Profile } from './entities/profile.entity';
import { FindManyOptions, QueryRunner, Repository, ILike, Like } from 'typeorm';
import { RegisterProfileInfoDto } from './dtos/register-profile-info';
import { User } from '../user/entities/user.entity';
import { UpdateProfileInfoDto } from './dtos/update-profile-info-dto';
import { LocationModel } from '../location/entities/location.entity';
import { Member } from '../member/entities/member.entity';
import { PaginateProfileDto } from './dtos/paginate-profile-dto';
import { CommonService } from '../common/common.service';

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
    ) {}

    //   async getTeamNameByUserId(userId: string): Promise<string | null> {
    //     const profile = await this.profileRepository.findOne({ where: { user_id: userId } });
    //     return profile ? profile.team_name : null;
    //   }

    async paginateMyProfile(userId:number, dto: PaginateProfileDto, name?: string) {
        const user = await this.userRepository.findOne({where: {id: userId}});
        const profile = await this.profileRepository.findOne({where: {user: {id: userId}}})
        const member =await this.memberRepository.findOne({where: {user: {id: userId}}})
        console.log("user=",user);
        console.log("profile=",profile);
        console.log("member=",member);
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

        return await this.commonService.paginate(dto, this.profileRepository, options , 'profile');
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
        qr?: QueryRunner,
    ): Promise<Profile> {
        const profileRepository = this.getProfileRepository(qr);
        const userRepository = this.getUserRepository(qr);
        const memberRepository = this.getMemberRepository(qr);

        console.log('registerProfileInfoDto');
        console.log(registerProfileInfoDto);

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

        const registeredProfile = await profileRepository.save({
            ...registerProfileInfoDto,
            name: user.name,
            user,
            member,
        });
        // const registeredProfile = await profileRepository.save(user.profile);
        // throw new Error('Method not implemented.');
        await userRepository.save({ ...user, profile: registeredProfile });
        return registeredProfile;
    }

    async updateProfileInfo(
        userId: number,
        updateProfileInfoDto: UpdateProfileInfoDto,
    ): Promise<Profile> {
        try {
            console.log('Update Profile Info - UserId:', userId);
            console.log('Update Profile Info DTO:', updateProfileInfoDto);

            // Fetch the user along with the profile
            const user = await this.userRepository.findOne({
                where: { id: userId },
                relations: ['profile'],
            });

            console.log('User:', user);

            if (!user) {
                throw new NotFoundException('User not found');
            }

            // Ensure the profile is loaded
            if (!user.profile) {
                // Load the profile separately
                user.profile = await this.profileRepository.findOne({
                    where: { user: { id: userId } },
                });

                if (!user.profile) {
                    throw new NotFoundException('Profile not found');
                }
            }

            console.log('User Profile:', user.profile);

            // Update profile fields
            // user.profile.preferredPosition = updateProfileInfoDto.preferredPosition;
            // user.profile.weight = updateProfileInfoDto.weight;
            // user.profile.height = updateProfileInfoDto.height;
            // user.profile.age = updateProfileInfoDto.age;
            // user.profile.gender = updateProfileInfoDto.gender;

            // Save the updated profile
            const updatedProfile = await this.profileRepository.save({
                ...user.profile,
                ...updateProfileInfoDto,
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
}
