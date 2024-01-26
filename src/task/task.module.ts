import { Module } from '@nestjs/common';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { JobsService } from '../jobs/jobs.service';
import { LocationService } from '../location/location.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationModel } from '../location/entities/location.entity';
import { SoccerField } from '../match/entities/soccer-field.entity';

@Module({
    imports: [TypeOrmModule.forFeature([LocationModel, SoccerField])],
    controllers: [TaskController],
    providers: [TaskService, JobsService, LocationService],
})
export class TaskModule {}
