import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MatchResult } from 'src/match/entities/match-result.entity';
import { TeamStats } from 'src/match/entities/team-stats.entity';
import { Repository } from 'typeorm';
import { StatisticsDto } from './dto/statistics.dto';

@Injectable()
export class StatisticsService {
    constructor(
        @InjectRepository(TeamStats)
        private readonly teamStatsRepository: Repository<TeamStats>,
        @InjectRepository(MatchResult)
        private readonly matchResultRepository: Repository<MatchResult>,
    ) {}

    async getTeamStats(teamId: number): Promise<StatisticsDto> {
        const getWinsAndLosesAndDraws = await this.getWinsAndLosesAndDraws(teamId);
        const getGoals = await this.getGoals(teamId);
        const getConceded = await this.getConceded(teamId);

        return {
            ...getWinsAndLosesAndDraws,
            goals: getGoals,
            conceded: getConceded,
        };
    }

    /**
     * 해당 팀 전체 실점 가져오기
     * @param teamId
     * @returns
     */
    async getConceded(teamId: number) {
        const conceded = await this.matchResultRepository
            .createQueryBuilder('match_results')
            .select('match_results.goals')
            .where(
                'match_results.match_id IN (SELECT match_id FROM match_results WHERE team_id = :teamId)',
                {
                    teamId,
                },
            )
            .andWhere('match_results.team_id <> :teamId', { teamId })
            .getMany();

        let sum = 0;
        conceded.forEach((data) => (sum += Number(data.goals)));

        return sum;
    }

    /**
     * 해당 팀 전체 골수 가져오기
     * @param temaId
     * @returns
     */
    async getGoals(teamId: number) {
        const goals = await this.matchResultRepository
            .createQueryBuilder('match_results')
            .select('match_results.goals')
            .where('match_results.team_id = :teamId', { teamId })
            .getMany();

        let sum = 0;
        goals.forEach((data) => (sum += Number(data.goals)));

        return sum;
    }

    /**
     * 해당 팀 승무패 가져오기
     * @param teamId
     * @returns
     */
    async getWinsAndLosesAndDraws(teamId: number) {
        const stats = await this.teamStatsRepository.findOne({
            where: {
                team_id: teamId,
            },
        });

        return {
            wins: stats.wins,
            loses: stats.loses,
            draws: stats.draws,
            totalGames: stats.total_games,
        };
    }
}
