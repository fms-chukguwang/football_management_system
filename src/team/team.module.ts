import { Module, forwardRef } from '@nestjs/common';
import { TeamService } from './team.service';
import { TeamController } from './team.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamModel } from './entities/team.entity';
import { AwsModule } from 'src/aws/aws.module';
import { LocationModule } from 'src/location/location.module';
import { MemberModule } from 'src/member/member.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([TeamModel]),
        AwsModule,
        LocationModule,
        forwardRef(() => MemberModule),
    ],
    exports: [TeamService],
    controllers: [TeamController],
    providers: [TeamService],
})
export class TeamModule {}
