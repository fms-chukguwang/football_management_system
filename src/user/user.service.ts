import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { compare } from 'bcrypt';
import { UpdateMyInfoDto } from '../auth/dtos/update-my-info.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async findAllUsers() {
    const users = await this.userRepository.find();

    if (!users) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    return users;
  }

  async findOneById(id: number) {
    const user = await this.userRepository.findOneBy({ id });
    console.log('user=', user);

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    return user;
  }

  async findOneByEmail(email: string): Promise<User | null> {
    const user = await this.userRepository.findOneBy({ email });

    if (!user) {
      throw new NotFoundException(`임메일을 찾을수 없습니다`);
    }

    return user;
  }

  async updateMyInfo(
    id: number,
    updateMyInfoDto: UpdateMyInfoDto,
  ): Promise<User> {
    try {
      const user = await this.userRepository.findOneBy({ id });

      if (!user) {
        throw new Error('User not found');
      }

      if (updateMyInfoDto.name) {
        user.name = updateMyInfoDto.name;
      }

      if (updateMyInfoDto.email) {
        user.email = updateMyInfoDto.email;
      }

      const updatedUser = await this.userRepository.save(user);

      return updatedUser;
    } catch (error) {
      console.error('Error updating user info:', error.message);
      throw new Error('Failed to update user info');
    }
  }

  async deleteId(id: number) {
    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException(`User with ID ${user} not found`);
    }

    // Soft delete 처리
    await this.userRepository.softDelete(user);
  }
}
