// profile.module.ts

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from './entities/profile.entity';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { User } from 'src/user/entities/user.entity';
import { UserModule } from 'src/user/user.module'; 

@Module({
  imports: [
    TypeOrmModule.forFeature([Profile]),
    AuthModule,
    UserModule, 
  ],
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}
