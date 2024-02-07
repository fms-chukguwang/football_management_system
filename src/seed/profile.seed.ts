import { DataFactory, Seeder } from 'nestjs-seeder';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from '../profile/entities/profile.entity';

@Injectable()
export class ProfileSeed implements Seeder {
  constructor(
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
  ) {}

  seed(): Promise<any> {
    const profile = DataFactory.createForClass(Profile).generate(50);

    return this.profileRepository.insert(profile);
  }
  drop(): Promise<any> {
    return this.profileRepository.delete({});
  }
}
