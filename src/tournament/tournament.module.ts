import { Module } from '@nestjs/common';
import { TournamentService } from './tournament.service';
import { TournamentController } from './tournament.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TournamentModel } from './entities/tournament.entity';
import { MemberModule } from '../member/member.module';
import { TeamModel } from '../team/entities/team.entity';
import { UserModule } from '../user/user.module';
import { JobsService } from '../jobs/jobs.service';
import { JobsModule } from '../jobs/jobs.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([TournamentModel, TeamModel]),
        MemberModule,
        UserModule,
        JobsModule,
    ],
    controllers: [TournamentController],
    providers: [TournamentService],
})
export class TournamentModule {}
