import { HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MatchFormation } from '../formation/entities/formation.entity';
import { DataSource, Repository, getRepository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { UpdateFormationDto } from './dtos/update-formation.dto';
import { Member } from '../member/entities/member.entity';
import { MatchService } from '../match/match.service';
import { Match } from '../match/entities/match.entity';
import { PlayerStats } from '../match/entities/player-stats.entity';
import { MatchResult } from '../match/entities/match-result.entity';

interface MatchResultDetail {
    match_id: number;
    result: number; // 1: 승리, 0: 무승부, -1: 패배
    formation: string;
  }

@Injectable()
export class FormationService {
    constructor(
        @InjectRepository(MatchFormation)
        private matchFormationRepository: Repository<MatchFormation>,

        @InjectRepository(PlayerStats)
        private playerStatsRepository: Repository<PlayerStats>,

        @InjectRepository(MatchResult)
        private matchResultRepository: Repository<MatchResult>,

        @InjectRepository(User)
        private userRepository: Repository<User>,

        @InjectRepository(Member)
        private memberRepository: Repository<Member>,

        @InjectRepository(Match)
        private matchRepository: Repository<Match>,

        private readonly dataSource: DataSource,
    ) {}

    /**
     * 팀별 포메이션 조회
     * @param  teamId
     * @param  matchId
     * @returns
     */
    async getMatchFormation(teamId: number,matchId: number,id?: number) {
        const whereCondition = {
            team_id: teamId,
            match_id: matchId,
          };
        
        // position 변수가 제공되면 where 조건에 추가
        if (id) {
        whereCondition['member_id'] = id;
        }

        const matchFormation = await this.matchFormationRepository
        .createQueryBuilder("matchFormation")
        .innerJoinAndSelect("matchFormation.member", "member", "member.deleted_at IS NULL")
        .leftJoinAndSelect("member.user", "user") // 여기서는 LEFT JOIN을 사용하여 user 정보는 있으면 가져오고 없으면 무시합니다.
        .where("matchFormation.team_id = :teamId", { teamId })
        .andWhere("matchFormation.match_id = :matchId", { matchId })
        .andWhere(id ? "matchFormation.member_id = :id" : "1=1", { id })
        .getMany();

        return matchFormation;
    }

    /**
     * 팀별 포메이션 저장
     * @param  teamId
     * @param  matchId
     * @returns
     */
    async saveMatchFormation(teamId: number, matchId: number,updateFormationDto:UpdateFormationDto) {

        const matchFormation = await this.getMatchFormation(teamId,matchId);

        const queryRunner = this.dataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try{
            // 조회한 모든 기존 포메이션 정보를 삭제
            if (matchFormation.length > 0) {
                await queryRunner.manager.delete('match_formations', {
                    team_id: teamId,
                    match_id: matchId
                });
            }

            // 새 포메이션 정보 삽입
            for (const playerPosition of updateFormationDto.playerPositions) {

                const playerFormation = await this.matchFormationRepository.create({
                    team_id: teamId,
                    match_id: matchId,
                    member_id: playerPosition.id,
                    formation: updateFormationDto.currentFormation,
                    position: playerPosition.position,
                });

                await queryRunner.manager.save(playerFormation);
            }

            await queryRunner.commitTransaction();
        }catch(error){

            await queryRunner.rollbackTransaction();
            if (error instanceof HttpException) {
                // HttpException을 상속한 경우(statusCode 속성이 있는 경우)
                throw error;
            } else {
                // 그 외의 예외
                throw new InternalServerErrorException('서버 에러가 발생했습니다.');
            }

        }finally{

            await queryRunner.release();

        }

        return matchFormation;
    }

    /**
     * 팀별 포메이션 조회
     * @param  teamId
     * @param  matchId
     * @returns
     */
    async getPopularFormation() {

        const result = await this.matchFormationRepository
        .createQueryBuilder("matchFormation")
        .select("matchFormation.formation", "formation")
        .addSelect("COUNT(matchFormation.formation)", "cnt")
        .groupBy("matchFormation.match_id")
        .addGroupBy("matchFormation.team_id")
        .addGroupBy("matchFormation.formation")
        .orderBy("cnt", "DESC")
        .limit(3)
        .getRawMany();

        return result;
    }

    /**
     * 최근 3경기간 최다 누적 경고자 조회
     * @param  teamId
     * @param  matchId
     * @returns
     */
    async getWarningmember(teamId: number) {

        const rawResults = await this.dataSource.query(`

            SELECT member_id, yellowCards
            FROM(
                SELECT member_id, SUM(yellow_cards) yellowCards
                FROM player_statistics
                WHERE team_id = ? AND match_id IN (
                SELECT match_id
                FROM (
                    SELECT DISTINCT match_id
                    FROM player_statistics
                    WHERE team_id = ?
                    ORDER BY match_id DESC
                    LIMIT 3
                ) AS subquery
                )
                GROUP BY member_id
                ORDER BY SUM(yellow_cards) DESC
            ) AS members
            WHERE yellowCards > 0
            LIMIT 3

        `,[teamId,teamId]);

        // const result = await Promise.all(
        //     rawResults.map(async (member) => {
        //         // const memberData =  await this.memberRepository.findOne({
        //         //     relations:{
        //         //         user: true
        //         //     },
        //         //     select : {
        //         //         user:{
        //         //             name: true
        //         //         }
        //         //     },where :{
        //         //         id:member.member_id,
        //         //         deleted_at: null
        //         //     }
        //         // });
        //         const memberData = await this.memberRepository
        //         .createQueryBuilder("member")
        //         .leftJoinAndSelect("member.user", "user")
        //         .where("member.id = :id", { id: member.member_id })
        //         .andWhere("member.deleted_at IS NULL") // deleted_at이 NULL인 조건을 추가
        //         .select([
        //             "member.id",
        //             "user.name"
        //         ])
        //         .getOne();
        //         return { ...member, memberData};
        //     }),
        // );

        const result = (await Promise.all(
            rawResults.map(async (member) => {
                const memberData = await this.memberRepository
                    .createQueryBuilder("member")
                    .leftJoinAndSelect("member.user", "user")
                    .where("member.id = :id", { id: member.member_id })
                    .andWhere("member.deleted_at IS NULL")
                    .select(["member.id", "user.name"])
                    .getOne();
        
                return memberData ? { ...member, memberData } : null;
            }),
        )).filter(item => item !== null); // `null`인 항목을 결과에서 제외

        return result;
    }

    /**
     * 해당팀 경기결과(승,무,패), 포메이션 조회
     * @param  teamId
     * @param  matchId
     * @returns
     */
    async getTeamMatchInfo(homeTeamId:number) {


        const homeMatchList = await this.matchRepository.find({where: [{ home_team_id: homeTeamId }, { away_team_id: homeTeamId }],})

        // const homePlayerStats = await this.playerStatsRepository.find({where:{team_id:homeTeamId}});
        // const opponentPlayerStats = await this.playerStatsRepository.find({where:{team_id:opponent_team_id}});

        // 경기 결과를 담을 배열
        const matchResults = [];

        for (const match of homeMatchList) {
            // 현재 경기의 모든 선수 통계 가져오기
            const playerStats = await this.playerStatsRepository.find({
                where: { match_id: match.id }
            });

            // 경기별 팀별로 골수 합산
            let homeGoals = 0;
            let awayGoals = 0;
            for (const stat of playerStats) {
                if (stat.team_id === homeTeamId && stat.match_id === match.id) {
                    homeGoals += stat.goals;
                } else {
                    awayGoals += stat.goals;
                }
            }

            // 승무패 결과 계산
            let result;
            if (homeGoals > awayGoals) {
                result = 1; // 승리
            } else if (homeGoals === awayGoals) {
                result = 0; // 무승부
            } else {
                result = -1; // 패배
            }

            // 현재 경기의 포메이션 정보 조회
            const formation = await this.getMatchFormation(homeTeamId, match.id);

            // formation 배열의 첫 번째 요소에서 formation 필드 값 추출
            const teamFormation = formation.length > 0 ? formation[0].formation : "정보 없음";

            // 경기 ID, 결과, 그리고 포메이션 정보를 배열에 추가
            matchResults.push({
                match_id: match.id,
                result: result,
                formation: teamFormation // 여기에 포메이션 정보 추가
            });
        }

        return matchResults;
    }

    /**
     * 최적 포메이션 조회
     * @param  teamId
     * @param  matchId
     * @returns
     */
    async getBestFormation(homeTeamId:number, opponent_team_id: number) {

        const homeMatchList = await this.getTeamMatchInfo(homeTeamId);
        const opponentMatchList = await this.getTeamMatchInfo(opponent_team_id);

        const homeWinLoseRate  = await this.calculateFormationWinRate(homeMatchList);
        const opponentWinLoseRate  = await this.calculateFormationWinRate(opponentMatchList);
      
        // 홈팀의 최고 승률 포메이션 찾기
        let homeBestFormation = "";
        let highestWinRate = 0;
        homeWinLoseRate.forEach((value, formation) => {
            if (value.winRate > highestWinRate) {
            homeBestFormation = formation;
            highestWinRate = value.winRate;
            }
        });

        // 상대팀의 최고 패배율 포메이션 찾기
        let opponentHighestLoseFormation = "";
        let highestLoseRate = 0;
        opponentWinLoseRate.forEach((value, formation) => {
            if (value.loseRate > highestLoseRate) {
            opponentHighestLoseFormation = formation;
            highestLoseRate = value.loseRate;
            }
        });

        // 승리 확률 계산 (단순화된 모델을 가정)
        let winProbability = (highestWinRate - highestLoseRate + 1) / 2; // 가정된 계산식
        winProbability = Math.max(0, Math.min(winProbability, 1)); // 확률은 0과 1 사이의 값이어야 함

        return {
            formation1:homeBestFormation,
            formation2:opponentHighestLoseFormation,
            winProbability
        };
        
    }

    // 포메이션별 승률 계산
    async calculateFormationWinRate(matchList: MatchResultDetail[]): Promise<Map<string, { winRate: number, loseRate: number, games: number }>> {
        const formationStats: Map<string, { wins: number; losses: number; games: number }> = new Map();
    
        matchList.forEach(match => {
        const formation = match.formation;
        if (!formationStats.has(formation)) {
            formationStats.set(formation, { wins: 0, losses: 0, games: 0 });
        }
        const stats = formationStats.get(formation);
        stats.games += 1;
        if (match.result === 1) { // 승리
            stats.wins += 1;
        } else if (match.result === -1) { // 패배
            stats.losses += 1;
        }
        });
    
        // 승률과 패배율 계산
        const formationWinLoseRate: Map<string, { winRate: number; loseRate: number; games: number }> = new Map();
        formationStats.forEach((value, key) => {
        formationWinLoseRate.set(key, {
            winRate: value.wins / value.games,
            loseRate: value.losses / value.games,
            games: value.games
        });
        });
    
        return formationWinLoseRate;
    }
  
}
