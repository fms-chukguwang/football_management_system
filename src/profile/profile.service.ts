import {
    Injectable,
    NotFoundException,
    UnauthorizedException,
  } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { Profile } from './entities/profile.entity';
  import { Repository } from 'typeorm';
  import { compare } from 'bcrypt';
import { UpdateProfileInfoDto } from './dtos/update-profile-info-dto';
import { RegisterProfileInfoDto } from './dtos/register-profile-info';

  @Injectable()
  export class ProfileService {
    constructor(
      @InjectRepository(Profile)
      private readonly profileRepository: Repository<Profile>,
    ) {}
  
    async findAllprofiles() {
      const profiles = await this.profileRepository.find();
  
      if (!profiles) {
        throw new NotFoundException('프로필를 찾을 수 없습니다.');
      }
  
      return profiles;
    }
  
    async findOneById(id: number) {
      const profile = await this.profileRepository.findOneBy({ id });
      console.log('profile=', profile);
  
      if (!profile) {
        throw new NotFoundException('프로필를 찾을 수 없습니다.');
      }
  
      return profile;
    }
  
    async findOneByName(name: string): Promise<Profile | null> {
      const profile = await this.profileRepository.findOneBy({ name });
  
      if (!profile) {
        throw new NotFoundException(`이름을 찾을수 없습니다`);
      }
  
      return profile;
    }
  
    async registerprofile(
      id: number,
      registerProfileInfoDto: RegisterProfileInfoDto,
    ): Promise<Profile> {
      try {
        const profile = await this.profileRepository.findOneBy({ id });
  
        if (!profile) {
          throw new Error('profile not found');
        }
  
        const registeredprofile = await this.profileRepository.save(profile);
  
        return registeredprofile;
      } catch (error) {
        console.error('Error updating profile info:', error.message);
        throw new Error('Failed to update profile info');
      }
    }
  
    async updateprofileInfo(
      id: number,
      updateProfileInfoDto: UpdateProfileInfoDto,
    ): Promise<Profile> {
      try {
        const profile = await this.profileRepository.findOneBy({ id });
  
        if (!profile) {
          throw new Error('profile not found');
        }

        const updatedprofile = await this.profileRepository.save(profile);
  
        return updatedprofile;
      } catch (error) {
        console.error('Error updating profile info:', error.message);
        throw new Error('Failed to update profile info');
      }
    }
  
    async deleteId(id: number) {
      const profile = await this.profileRepository.findOneBy({ id });
  
      if (!profile) {
        throw new NotFoundException('프로필를 찾을 수 없습니다.');
      }
  
      // 프로필 삭제
      await this.profileRepository.remove(profile);
  
      return profile;
    }
  }
  