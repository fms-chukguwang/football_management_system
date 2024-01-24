
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Profile } from './entities/profile.entity';
import { QueryRunner, Repository } from 'typeorm';
import { RegisterProfileInfoDto } from './dtos/register-profile-info';
import { User } from '../user/entities/user.entity';
import { UpdateProfileInfoDto } from './dtos/update-profile-info-dto';
import { LocationModel } from '../location/entities/location.entity';

@Injectable()
export class ProfileService {
    constructor(
        @InjectRepository(Profile)
        private readonly profileRepository: Repository<Profile>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}


//   async getTeamNameByUserId(userId: string): Promise<string | null> {
//     const profile = await this.profileRepository.findOne({ where: { user_id: userId } });
//     return profile ? profile.team_name : null;
//   }

    async findAllProfiles() {
        const profiles = await this.profileRepository.find();

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

    async registerProfile(
        userId: number,
        registerProfileInfoDto: RegisterProfileInfoDto,
        qr?: QueryRunner,
    ): Promise<Profile> {
        const profileRepository = this.getProfileRepository(qr);
        const userRepository = this.getUserRepository(qr);

        console.log('registerProfileInfoDto');
        console.log(registerProfileInfoDto);

        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['profile'],
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (!user.profile) {
            user.profile = new Profile();
        }

        // user.profile.name = user.name;
        // user.profile.preferredPosition = registerProfileInfoDto.preferredPosition;
        // user.profile.weight = registerProfileInfoDto.weight;
        // user.profile.height = registerProfileInfoDto.height;
        // user.profile.age = registerProfileInfoDto.age;
        // user.profile.gender = registerProfileInfoDto.gender;
        // user.profile.user = user;

        const registeredProfile = await profileRepository.save({
            ...registerProfileInfoDto,
            name: user.name,
            user,
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
            user.profile.preferredPosition = updateProfileInfoDto.preferredPosition;
            user.profile.weight = updateProfileInfoDto.weight;
            user.profile.height = updateProfileInfoDto.height;
            user.profile.age = updateProfileInfoDto.age;
            user.profile.gender = updateProfileInfoDto.gender;

            // Save the updated profile
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
}
