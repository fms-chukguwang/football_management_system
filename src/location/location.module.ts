import { Module } from '@nestjs/common';
import { LocationService } from './location.service';
import { LocationController } from './location.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationModel } from './entities/location.entity';
import { SoccerFieldModel } from '../soccerfield/entities/soccerfield.entity';

@Module({
    imports: [TypeOrmModule.forFeature([SoccerFieldModel, LocationModel])],
    exports: [LocationService],
    controllers: [LocationController],
    providers: [LocationService],
})
export class LocationModule {}
