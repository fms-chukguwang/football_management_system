import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SoccerField } from 'src/match/entities/soccer-field.entity';
import { LocationModel } from 'src/location/entities/location.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
        SoccerField,
        LocationModel,
    ]),
],
  providers: [JobsService],
  controllers: [JobsController]
})
export class JobsModule {}