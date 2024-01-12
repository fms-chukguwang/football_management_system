import { DataFactory, Seeder } from 'nestjs-seeder';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';

@Injectable()
export class UserSeed implements Seeder {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  seed(): Promise<any> {
    const user = DataFactory.createForClass(User).generate(50);

    return this.userRepository.insert(user);
  }
  drop(): Promise<any> {
    return this.userRepository.delete({});
  }
}
