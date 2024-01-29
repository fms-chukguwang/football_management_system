import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TeamStats } from 'src/match/entities/team-stats.entity';
import { Repository } from 'typeorm';

@Injectable()
export class StatisticsService {
    constructor(
        @InjectRepository(TeamStats)
        private readonly teamStatsRepository: Repository<TeamStats>,
    ) {}

    async getTeamStats(teamId: number) {
        const stats = await this.teamStatsRepository.find({
            where: {
                team_id: teamId,
            },
        });

        console.log(stats);
    }
}
