import { Module } from '@nestjs/common';
import { SoccerfieldService } from './soccerfield.service';
import { SoccerfieldController } from './soccerfield.controller';
import { SoccerFieldModel } from './entities/soccerfield.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
    imports: [TypeOrmModule.forFeature([SoccerFieldModel])],
    controllers: [SoccerfieldController],
    providers: [SoccerfieldService],
})
export class SoccerfieldModule {}
