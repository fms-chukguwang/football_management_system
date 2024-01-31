import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { CommonModule } from '../common/common.module';
import { UserModule } from '../user/user.module';
import { TeamModel } from 'src/team/entities/team.entity';
import { TeamModule } from 'src/team/team.module';

@Module({
    imports: [TypeOrmModule.forFeature([User, TeamModel]), CommonModule, UserModule, TeamModule],
    controllers: [AdminController],
    providers: [AdminService],
})
export class AdminModule {}
