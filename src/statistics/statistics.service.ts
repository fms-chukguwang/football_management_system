import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MatchResult } from '../match/entities/match-result.entity';
import { TeamStats } from '../match/entities/team-stats.entity';
import { Repository } from 'typeorm';
import { StatisticsDto } from './dto/statistics.dto';
import { PlayerStats } from 'src/match/entities/player-stats.entity';
import { TopPlayerDto } from './dto/top-player.dto';
import { Member } from 'src/member/entities/member.entity';
import { PlayersDto } from './dto/players.dto';
import { YellowAndRedCardsDto } from './dto/yellow-and-red-cards.dto';

@Injectable()
export class StatisticsService {
    constructor(
        @InjectRepository(TeamStats)
        private readonly teamStatsRepository: Repository<TeamStats>,
        @InjectRepository(MatchResult)
        private readonly matchResultRepository: Repository<MatchResult>,
        @InjectRepository(PlayerStats)
        private readonly playerStatsRepository: Repository<PlayerStats>,
        @InjectRepository(Member)
        private readonly memberRepository: Repository<Member>,
    ) {}

    /**
     * 팀 스탯 + 다른 팀 스탯 가져오기
     * @param teamId
     * @returns
     */
    async getTeamStats(teamId: number): Promise<StatisticsDto> {
        try {
            const goals = await this.getGoals(teamId);
            const getWinsAndLosesAndDraws = await this.getWinsAndLosesAndDraws(teamId);
            const conceded = await this.getConceded(teamId);
            const cleanSheet = await this.getCleanSheet(teamId);
            const assists = await this.getAssists(teamId);
            const otherTeamStats = await this.getStatsForOtherTeams(teamId);

            return {
                ...getWinsAndLosesAndDraws,
                goals,
                conceded,
                cleanSheet,
                assists,
                otherTeam: {
                    ...otherTeamStats,
                },
            };
        } catch (err) {
            console.log(err);
        }
    }

    async getMemberStats(teamId: number) {
        const getWinsAndLosesAndDraws = await this.getWinsAndLosesAndDraws(teamId);
        const goals = await this.getGoals(teamId);
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
        const subQuery = this.playerStatsRepository
            .createQueryBuilder('sub_stats')
            .select('sub_stats.match_id')
            .where('sub_stats.team_id = :teamId', { teamId });

        const conceded = await this.playerStatsRepository
            .createQueryBuilder('stats')
            .select('SUM(stats.goals) as goals')
            .where(`stats.match_id IN (${subQuery.getQuery()})`, {
                teamId,
            })
            .andWhere('stats.team_id <> :teamId', { teamId })
            .setParameters(subQuery.getParameters())
            .getRawOne();

        console.log('실점입니다, ', conceded.goals);
        return conceded?.goals ? parseInt(conceded?.goals) : 0;
    }

    /**
     * 해당 팀 전체 골수 가져오기
     * @param temaId
     * @returns
     */
    async getGoals(teamId: number) {
        console.log('팀아이디는 : ', teamId);
        const goals = await this.playerStatsRepository
            .createQueryBuilder('player_statistics')
            .select(['SUM(player_statistics.goals) as totalGoals'])
            .where('player_statistics.team_id = :teamId', { teamId })
            .getRawOne();

        console.log(goals);
        return goals?.totalGoals ? parseInt(goals.totalGoals) : 0;
    }

    /**
     * 해당팀 어시스트 가져오기
     * @param teamId
     * @returns
     */
    async getAssists(teamId: number) {
        const assists = await this.playerStatsRepository
            .createQueryBuilder('stats')
            .select('SUM(stats.assists) as totalAssists')
            .where('stats.team_id = :teamId', { teamId })
            .getRawOne();

        return assists?.totalAssists ? parseInt(assists.totalAssists) : 0;
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

        return cleanSheet?.count ? parseInt(cleanSheet.count) : 0;
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
            wins: stats?.wins ?? 0,
            loses: stats?.loses ?? 0,
            draws: stats?.draws ?? 0,
            totalGames: stats?.total_games ?? 0,
        };
    }

    /**
     * 나를 제외한 다른팀 기록 가져오기
     * @param myTeamId
     */
    async getStatsForOtherTeams(myTeamId: number) {
        /**
         * 1) 우리팀 경기수보다 다른팀 경기수가 더 많지 않은지 체크(경기수를 맞춰서 정확한 통계를 위함)
         * 2) 우리팀의 경기수만큼 다른팀 데이터를 뽑아온다 (골, 어시스트, 클린시트)
         */
        try {
            const { myTeamGameCount } = await this.playerStatsRepository
                .createQueryBuilder('stats')
                .select('COUNT(DISTINCT match_id) as myTeamGameCount')
                .where('stats.team_id = :myTeamId', { myTeamId })
                .orderBy('stats.created_at', 'DESC')
                .getRawOne();

            const { otherTeamGameCount } = await this.playerStatsRepository
                .createQueryBuilder('stats')
                .select('COUNT(DISTINCT match_id) as otherTeamGameCount')
                .where('stats.team_id != :myTeamId', { myTeamId })
                .orderBy('stats.created_at', 'DESC')
                .getRawOne();

            if (myTeamGameCount > otherTeamGameCount) {
                throw new BadRequestException(
                    `내팀 경기수 ${myTeamGameCount}와 상태팀 경기수 ${otherTeamGameCount}가 맞지 않습니다.`,
                );
            }

            const total = await this.playerStatsRepository
                .createQueryBuilder('sub_stats')
                .select([
                    'SUM(sub_stats.goals) as totalGoals',
                    'SUM(sub_stats.assists) as totalAssists',
                    'SUM(sub_stats.clean_sheet) as totalCleanSheets',
                ])
                .where('sub_stats.team_id != :myTeamId', { myTeamId })
                .groupBy('sub_stats.match_id')
                .orderBy('sub_stats.created_at', 'DESC')
                .limit(myTeamGameCount)
                .getRawMany();

            let totalGoals = 0;
            let totalAssists = 0;
            let totalCleanSheet = 0;

            total.forEach((data) => {
                totalGoals += parseInt(data.totalGoals);
                totalAssists += parseInt(data.totalAssists);
                totalCleanSheet += parseInt(data.totalCleanSheets);
            });

            return {
                totalGoals,
                totalAssists,
                totalCleanSheet,
            };
        } catch (err) {
            console.log(err);
        }
    }

    /**
     * 스탯별 상위선수 가져오기
     * @param teamId
     * @returns
     */
    async getTopPlayer(teamId: number): Promise<TopPlayerDto> {
        const topGoalsMembers = await this.getTopGoalsMembers(teamId);
        const topAssistsMembers = await this.getTopAssistsMembers(teamId);
        const topJoiningMembers = await this.getTopJoiningMembers(teamId);
        const topSaveMembers = await this.getTopSaveMembers(teamId);
        const topAttactPointMembers = await this.getTopAttactPoint(teamId);

        return {
            topGoals: topGoalsMembers,
            topAssists: topAssistsMembers,
            topJoining: topJoiningMembers,
            topSave: topSaveMembers,
            topAttactPoint: topAttactPointMembers,
        };
    }

    /**
     * 우리팀 득점 랭킹 가져오기
     * @param teamId
     * @returns
     */
    async getTopGoalsMembers(teamId: number) {
        const rankGoalsMembers = await this.playerStatsRepository
            .createQueryBuilder('stats')
            .select([
                'stats.team_id as teamId',
                'SUM(stats.goals) as totalGoals',
                'stats.member_id as memberId',
                'users.name userName',
                'profile.image_uuid as image',
            ])
            .innerJoin('members', 'members', 'stats.member_id = members.id')
            .innerJoin('users', 'users', 'members.user_id = users.id')
            .innerJoin('profile', 'profile', 'profile.user_id = users.id')
            .where('stats.team_id = :teamId', { teamId })
            .groupBy('stats.member_id')
            .orderBy('stats.goals', 'DESC')
            .limit(3)
            .getRawMany();

        return rankGoalsMembers;
    }

    /**
     * 어시스트 랭킹 가져오기
     * @param teamId
     * @returns
     */
    async getTopAssistsMembers(teamId: number) {
        const rankAssistsMembers = await this.playerStatsRepository
            .createQueryBuilder('stats')
            .select([
                'stats.team_id as teamId',
                'SUM(stats.assists) as totalAssists',
                'stats.member_id as memberId',
                'users.name as userName',
                'profile.image_uuid as image',
            ])
            .innerJoin('members', 'members', 'stats.member_id = members.id')
            .innerJoin('users', 'users', 'members.user_id = users.id')
            .innerJoin('profile', 'profile', 'profile.user_id = users.id')
            .where('stats.team_id = :teamId', { teamId })
            .groupBy('stats.member_id')
            .orderBy('stats.assists', 'DESC')
            .limit(3)
            .getRawMany();

        return rankAssistsMembers;
    }

    /**
     * 경기수 랭킹 가져오기
     * @param teamId
     * @returns
     */
    async getTopJoiningMembers(teamId: number) {
        const rankJoiningMembers = await this.playerStatsRepository
            .createQueryBuilder('stats')
            .select([
                'stats.team_id as teamId',
                'count(stats.member_id) as joining',
                'stats.member_id as memberId',
                'users.name as userName',
                'profile.image_uuid as image',
            ])
            .innerJoin('members', 'members', 'stats.member_id = members.id')
            .innerJoin('users', 'users', 'members.user_id = users.id')
            .innerJoin('profile', 'profile', 'profile.user_id = users.id')
            .where('stats.team_id = :teamId', { teamId })
            .groupBy('stats.member_id')
            .orderBy('joining', 'DESC')
            .limit(3)
            .getRawMany();

        return rankJoiningMembers;
    }

    /**
     * 세이브수 랭킹 가져오기
     * @param teamId
     * @returns
     */
    async getTopSaveMembers(teamId: number) {
        const rankSaveMembers = await this.playerStatsRepository
            .createQueryBuilder('stats')
            .select([
                'stats.team_id as teamId',
                'SUM(stats.save) as totalSave',
                'stats.member_id as memberId',
                'users.name as userName',
                'profile.image_uuid as image',
            ])
            .innerJoin('members', 'members', 'stats.member_id = members.id')
            .innerJoin('users', 'users', 'members.user_id = users.id')
            .innerJoin('profile', 'profile', 'profile.user_id = users.id')
            .where('stats.team_id = :teamId', { teamId })
            .groupBy('stats.member_id')
            .orderBy('stats.save', 'DESC')
            .limit(3)
            .getRawMany();

        return rankSaveMembers;
    }
    /**
     * 공격 포인트 랭킹 가져오기
     * @param teamId
     * @returns
     */

    async getTopAttactPoint(teamId: number) {
        const rankAttactPoint = await this.playerStatsRepository
            .createQueryBuilder('stats')
            .select([
                'stats.team_id teamId',
                'SUM(stats.goals) + SUM(stats.assists) as attactPoint ',
                'stats.member_id memberId',
                'users.name userName',
                'profile.image_uuid as image',
            ])
            .innerJoin('members', 'members', 'stats.member_id = members.id')
            .innerJoin('users', 'users', 'members.user_id = users.id')
            .innerJoin('profile', 'profile', 'profile.user_id = users.id')
            .where('stats.team_id = :teamId', { teamId })
            .groupBy('stats.member_id')
            .orderBy('attactPoint', 'DESC')
            .limit(3)
            .getRawMany();

        return rankAttactPoint;
    }

    /**
     * 플레이어 목록 가져오기
     * @param teamId
     * @returns
     */
    async getPlayers(teamId: number): Promise<PlayersDto> {
        const players = await this.memberRepository
            .createQueryBuilder('members')
            .select([
                'members.id as memberId',
                'users.name as userName',
                'profile.image_uuid as image',
                'COUNT(members.id) as totalGames',
                'SUM(stats.goals) as totalGoals',
                'SUM(stats.assists) as totalAssists',
                'SUM(stats.goals) + SUM(stats.assists) as attactPoint',
                'SUM(stats.yellow_cards) as totalYellowCards',
                'SUM(stats.red_cards) as totalRedCards',
                'SUM(stats.clean_sheet) as totalÇleanSheet',
                'SUM(stats.save) as totalSave',
            ])
            .leftJoin('player_statistics', 'stats', 'members.id = stats.member_id')
            .leftJoin('users', 'users', 'members.user_id = users.id')
            .leftJoin('profile', 'profile', 'users.id = profile.user_id')
            .where('members.team_id = :teamId', { teamId })
            .groupBy('members.id')
            .orderBy('members.created_at', 'ASC')
            .getRawMany();

        return {
            players: [...players],
        };
    }

    /**
     * 최근 5경기 옐로우카드, 레드카드 통계 가져오기
     * @param teamId
     */
    async getYellowAndRedCards(teamId: number): Promise<YellowAndRedCardsDto> {
        const matchCount = this.playerStatsRepository
            .createQueryBuilder('players')
            .select('COUNT(DISTINCT DATE(players.created_at)) as count')
            .where('players.team_id = :teamId', { teamId });

        let { count } = await matchCount.getRawOne();

        if (+count > 5) {
            count -= 5;
        } else {
            count = 0;
        }

        const rawYellowAndRedCards = await this.playerStatsRepository
            .createQueryBuilder('players')
            .select([
                'players.yellow_cards as yellow',
                'players.red_cards as red',
                'DATE(players.created_at) as created',
            ])
            .where('players.team_id = :teamId', { teamId })
            .groupBy('created')
            .orderBy('created', 'ASC')
            .offset(count)
            .limit(5)
            .getRawMany();

        const yellowAndRedCards = rawYellowAndRedCards.map((item) => {
            const convertDate = new Date(item.created);

            return {
                ...item,
                created: convertDate.toLocaleDateString(),
            };
        });

        console.log(yellowAndRedCards);

        return {
            yellowAndRedCards: [...yellowAndRedCards],
        };
    }
}
