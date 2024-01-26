import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationModel } from '../location/entities/location.entity';
import { SoccerField } from '../match/entities/soccer-field.entity';

@Module({
    imports: [TypeOrmModule.forFeature([SoccerField, LocationModel])],
    providers: [JobsService],
    controllers: [JobsController],
})
export class JobsModule {}
