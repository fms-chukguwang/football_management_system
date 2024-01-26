import { Module } from '@nestjs/common';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { JobsService } from 'src/jobs/jobs.service';
import { LocationService } from 'src/location/location.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationModel } from 'src/location/entities/location.entity';
import { SoccerField } from 'src/match/entities/soccer-field.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([LocationModel, SoccerField]),
  ],
  controllers: [TaskController],
  providers: [TaskService,JobsService,LocationService]
})
export class TaskModule {}
