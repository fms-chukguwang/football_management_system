import { Module } from '@nestjs/common';
import { SoccerfieldService } from './soccerfield.service';
import { SoccerfieldController } from './soccerfield.controller';
import { SoccerFieldModel } from './entities/soccerfield.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SoccerField } from '../match/entities/soccer-field.entity';
import { CommonService } from '../common/common.service';

@Module({
    imports: [TypeOrmModule.forFeature([SoccerFieldModel,SoccerField])],
    controllers: [SoccerfieldController],
    providers: [SoccerfieldService,CommonService],
})
export class SoccerfieldModule {}
