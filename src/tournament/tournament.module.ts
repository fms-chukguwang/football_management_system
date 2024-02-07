import { Module } from '@nestjs/common';
import { TournamentService } from './tournament.service';
import { TournamentController } from './tournament.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TournamentModel } from './entities/tournament.entity';
import { MemberModule } from 'src/member/member.module';
import { TeamModel } from 'src/team/entities/team.entity';
import { UserModule } from 'src/user/user.module';
import { JobsService } from 'src/jobs/jobs.service';
import { JobsModule } from 'src/jobs/jobs.module';

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
