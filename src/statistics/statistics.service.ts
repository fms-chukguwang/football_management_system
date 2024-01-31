import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MatchResult } from 'src/match/entities/match-result.entity';
import { TeamStats } from 'src/match/entities/team-stats.entity';
import { Repository } from 'typeorm';
import { StatisticsDto } from './dto/statistics.dto';
import { PlayerStats } from 'src/match/entities/player-stats.entity';

@Injectable()
export class StatisticsService {
    constructor(
        @InjectRepository(TeamStats)
        private readonly teamStatsRepository: Repository<TeamStats>,
        @InjectRepository(MatchResult)
        private readonly matchResultRepository: Repository<MatchResult>,
        @InjectRepository(PlayerStats)
        private readonly playerStatsRepository: Repository<PlayerStats>,
    ) {}

    async getTeamStats(teamId: number): Promise<StatisticsDto> {
        const goals = await this.getGoals(teamId);
        const getWinsAndLosesAndDraws = await this.getWinsAndLosesAndDraws(teamId);
        const conceded = await this.getConceded(teamId);
        const cleanSheet = await this.getCleanSheet(teamId);
        // const count = await this.getStatsForOtherTeams(teamId);

        return {
            ...getWinsAndLosesAndDraws,
            goals,
            conceded,
            cleanSheet,
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
        const goals = await this.playerStatsRepository
            .createQueryBuilder('player_statistics')
            .select(['SUM(player_statistics.goals) as totalGoals'])
            .where('player_statistics.team_id = :teamId', { teamId })
            .getRawOne();

        return Number(goals.totalGoals);
    }

    /**
     * 해당팀 클린시트 개수 가져오기
     * @param teamId
     * @returns
     */
    async getCleanSheet(teamId: number) {
        const cleanSheet = await this.matchResultRepository
            .createQueryBuilder('match')
            .select('COUNT(match.clean_sheet) as count')
            .where('match.team_id = :teamId', { teamId })
            .andWhere('match.clean_sheet = true')
            .getRawOne();

        return Number(cleanSheet.count);
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

    /**
     * 나를 제외한 다른팀 기록 가져오기
     * @param myTeamId
     */
    async getStatsForOtherTeams(myTeamId: number) {
        const { count } = await this.matchResultRepository
            .createQueryBuilder('match')
            .select('COUNT(match.id) as count')
            .where('match.team_id = :myTeamId', { myTeamId })
            .orderBy('match.created_at', 'DESC')
            .getRawOne();

        if (count < 3) {
            throw new HttpException(
                '최소 3경기를 진행하셔야 통계에 반영됩니다.',
                HttpStatus.BAD_REQUEST,
            );
        }

        const { goals, cleanSheet, totalGames } = await this.matchResultRepository
            .createQueryBuilder('match')
            .select([
                'SUM(match.goals) as goals',
                'SUM(match.clean_sheet) as cleanSheet',
                'COUNT(id) as totalGames',
            ])
            .where('match.team_id <> :myTeamId', { myTeamId })
            .orderBy('match.created_at', 'DESC')
            .limit(Number(count))
            .getRawOne();

        console.log(goals, cleanSheet, totalGames);
    }
}
