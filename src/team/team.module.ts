import { Module, forwardRef } from '@nestjs/common';
import { TeamService } from './team.service';
import { TeamController } from './team.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamModel } from './entities/team.entity';
import { AwsModule } from '../aws/aws.module';
import { LocationModule } from '../location/location.module';
import { MemberModule } from '../member/member.module';
import { CommonModule } from '../common/common.module';
import { MatchFormation } from '../formation/entities/formation.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([TeamModel,MatchFormation]),
        AwsModule,
        LocationModule,
        forwardRef(() => MemberModule),
        CommonModule,
    ],
    exports: [TeamService],
    controllers: [TeamController],
    providers: [TeamService],
})
export class TeamModule {}
