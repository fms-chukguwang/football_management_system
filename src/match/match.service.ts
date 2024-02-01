import {
    BadRequestException,
    HttpException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, Not, Repository, getManager, getRepository } from 'typeorm';
import { createMatchDto } from './dtos/create-match.dto';
import { Match } from './entities/match.entity';
import { updateMatchDto } from './dtos/update-match.dto';
import { EmailService } from '../email/email.service';
import { EmailRequest } from './dtos/email-request.dto';
import { AuthService } from '../auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../user/entities/user.entity';
import { deleteMatchDto } from './dtos/delete-match.dto';
import { deleteRequestDto } from './dtos/delete-request.dto';
import { createRequestDto } from './dtos/create-request.dto';
import { updateRequestDto } from './dtos/update-request.dto';
import { createMatchResultDto } from './dtos/result-match.dto';
import { MatchResult } from './entities/match-result.entity';
import { createPlayerStatsDto } from './dtos/player-stats.dto';
import { PlayerStats } from './entities/player-stats.entity';
import { TeamStats } from './entities/team-stats.entity';
import { TeamModel } from '../team/entities/team.entity';
import { Member } from '../member/entities/member.entity';
import { SoccerField } from './entities/soccer-field.entity';
import { AwsService } from '../aws/aws.service';
import { ResultMembersDto } from './dtos/result-final.dto';
import { time } from 'console';

@Injectable()
export class MatchService {
    constructor(
        @InjectRepository(Match)
        private matchRepository: Repository<Match>,

        @InjectRepository(User)
        private userRepository: Repository<User>,

        @InjectRepository(Member)
        private memberRepository: Repository<Member>,

        @InjectRepository(TeamModel)
        private teamRepository: Repository<TeamModel>,

        @InjectRepository(MatchResult)
        private matchResultRepository: Repository<MatchResult>,

        @InjectRepository(PlayerStats)
        private playerStatsRepository: Repository<PlayerStats>,

        @InjectRepository(TeamStats)
        private teamStatsRepository: Repository<TeamStats>,

        @InjectRepository(SoccerField)
        private soccerFieldRepository: Repository<SoccerField>,

        private emailService: EmailService,
        private authService: AuthService,
        private jwtService: JwtService,
        private configService: ConfigService,
        private readonly awsService: AwsService,
        private readonly dataSource: DataSource,
    ) {}

    /**
     * 경기 생성 이메일 요청(상대팀 구단주에게)
     * @param userId
     * @param  createrequestDto
     * @returns
     */
    async requestCreMatch(userId: number, createrequestDto: createRequestDto) {
        //입력한 일자, 시간 예약 여부 체크
        await this.verifyReservedMatch(createrequestDto.date, createrequestDto.time);

        const token = this.authService.generateAccessEmailToken(userId);

        const homeCreator = await this.verifyTeamCreator(userId);

        const awayTeam = await this.getTeamInfo(createrequestDto.awayTeamId);

        // EmailRequest 객체 생성 및 초기화
        const emailRequest: EmailRequest = {
            email: awayTeam.creator.email,
            subject: '경기 일정 생성 요청',
            clubName: awayTeam.name,
            originalSchedule: `${createrequestDto.date} ${createrequestDto.time}`,
            newSchedule: `${createrequestDto.date} ${createrequestDto.time}`,
            reason: '경기 제안',
            homeTeamId: createrequestDto.homeTeamId,
            awayTeamId: createrequestDto.awayTeamId,
            fieldId: createrequestDto.fieldId,
            senderName: `${homeCreator[0].name} 구단주`,
            url: `http://localhost:${process.env.SERVER_PORT || 3000}/api/match/book/accept`,
            chk: 'create',
            token: token,
        };

        const send = await this.emailService.reqMatchEmail(emailRequest);
        console.log('send=', send);
        return send;
    }

    /**
     * 이메일 수락 후 경기 생성
     * @param  creatematchDto
     * @returns
     */
    async createMatch(creatematchDto: createMatchDto) {
        const payload = await this.jwtService.verify(creatematchDto.token, {
            secret: this.configService.get<string>('JWT_SECRET'),
        });

        const user = await this.userRepository.findOne({
            where: { id: payload.id },
        });

        if (!user) {
            throw new UnauthorizedException('사용자 정보가 유효하지 않습니다.');
        }

        //구단주 체크
        await this.verifyTeamCreator(user.id);

        const matchDate = creatematchDto.date;
        const matchTime = creatematchDto.time;

        //입력한 일자, 시간 예약 여부 체크
        await this.verifyReservedMatch(matchDate, matchTime);

        const match = this.matchRepository.create({
            owner_id: user.id,
            date: matchDate,
            time: matchTime,
            home_team_id: Number(creatematchDto.homeTeamId),
            away_team_id: Number(creatematchDto.awayTeamId),
            soccer_field_id: Number(creatematchDto.fieldId),
        });

        if (!match) {
            throw new NotFoundException('경기를 생성할 수 없습니다.');
        }

        await this.matchRepository.save(match);
        console.log(match);
        return match;
    }

    /**
     * 경기 일정 조회
     * @param  matchId
     * @returns
     */
    async findOneMatch(matchId: number) {
        const match = await this.matchRepository.findOne({
            where: { id: matchId },
        });

        if (!match) {
            throw new NotFoundException('해당 ID의 경기 일정이 없습니다.');
        }

        return match;
    }

    /**
     * 경기가 끝났는지 조회
     * @param matchId
     * @returns
     */
    async findIfMatchOver(matchId: number) {
        const match = await this.matchRepository.findOne({
            where: { id: matchId },
        });

        if (!match) {
            throw new NotFoundException('해당 ID의 경기 일정이 없습니다.');
        }

        // match.date와 match.time을 합쳐서 matchEndTime을 만듬
        const matchEndTime = new Date(`${match.date} ${match.time}`);

        // 경기 종료 시간을 2시간 더한 시간과 현재 시간을 비교하여 경기가 끝났는지 확인
        const matchEndTimePlus2Hours = new Date(matchEndTime);
        matchEndTimePlus2Hours.setHours(matchEndTimePlus2Hours.getHours() + 2);

        const currentTime = new Date();

        console.log('current Time=', currentTime);
        console.log('match time=', match.date, match.time);
        console.log('match end time +2 hr=', matchEndTimePlus2Hours);

        if (currentTime < matchEndTimePlus2Hours) {
            throw new NotFoundException('경기가 아직 안끝났습니다.');
        }

        return true;
    }

    /**
     * 경기 수정 이메일 요청(상대팀 구단주에게)
     * @param  userId
     * @param  matchId
     * @param  updaterequestDto
     * @returns
     */
    async requestUptMatch(userId: number, matchId: number, updaterequestDto: updateRequestDto) {
        const token = this.authService.generateAccessEmailToken(userId);

        // 구단주 체크
        const homeCreator = await this.verifyTeamCreator(userId);

        //입력한 일자, 시간 예약 여부 체크
        await this.verifyReservedMatch(updaterequestDto.date, updaterequestDto.time);

        const match = await this.verifyOneMatch(matchId, homeCreator[0].id);

        const awayTeam = await this.getTeamInfo(match.away_team_id);

        // EmailRequest 객체 생성 및 초기화
        const emailRequest: EmailRequest = {
            email: awayTeam.creator.email,
            subject: '경기 일정 수정 요청',
            clubName: awayTeam.name,
            originalSchedule: `${match.date} ${match.time}`,
            newSchedule: `${updaterequestDto.date} ${updaterequestDto.time}`,
            reason: updaterequestDto.reason,
            homeTeamId: 0,
            awayTeamId: 0,
            fieldId: 0,
            senderName: `${homeCreator[0].name} 구단주`,
            url: `http://localhost:${process.env.SERVER_PORT || 3000}/api/match/${matchId}/update`,
            chk: 'update',
            token: token,
        };

        const send = await this.emailService.reqMatchEmail(emailRequest);

        return send;
    }

    /**
     * 이메일 수락 후 경기 수정
     * @param  matchId
     * @param  updatematchDto
     * @returns
     */
    async updateMatch(matchId: number, updatematchDto: updateMatchDto) {
        const payload = await this.jwtService.verify(updatematchDto.token, {
            secret: this.configService.get<string>('JWT_SECRET'),
        });
        const user = await this.userRepository.findOne({
            where: { id: payload.userId },
        });

        if (!user) {
            throw new UnauthorizedException('사용자 정보가 유효하지 않습니다.');
        }

        // 구단주 체크
        await this.verifyTeamCreator(user.id);

        await this.findOneMatch(matchId);

        //입력한 일자, 시간 예약 여부 체크
        await this.verifyReservedMatch(updatematchDto.date, updatematchDto.time);

        const updateMatch = await this.matchRepository.update(
            { id: matchId },
            {
                date: updatematchDto.date,
                time: updatematchDto.time,
            },
        );

        return updateMatch;
    }

    /**
     * 경기 삭제 이메일 요청(상대팀 구단주에게)
     * @param  userId
     * @param  matchId
     * @param  deleterequestDto
     * @returns
     */
    async requestDelMatch(userId: number, matchId: number, deleterequestDto: deleteRequestDto) {
        const token = this.authService.generateAccessEmailToken(userId);

        // 구단주 체크
        const homeCreator = await this.verifyTeamCreator(userId);

        const match = await this.verifyOneMatch(matchId, homeCreator[0].id);

        const awayTeam = await this.getTeamInfo(match.away_team_id);

        // EmailRequest 객체 생성 및 초기화
        const emailRequest: EmailRequest = {
            email: awayTeam.creator.email,
            subject: '경기 일정 삭제 요청',
            clubName: awayTeam.name,
            originalSchedule: `${match.date} ${match.time}`,
            newSchedule: ``,
            reason: deleterequestDto.reason,
            homeTeamId: 0,
            awayTeamId: 0,
            fieldId: 0,
            senderName: `${homeCreator[0].name} 구단주`,
            url: `http://localhost:${process.env.SERVER_PORT || 3000}/api/match/${matchId}/delete`,
            chk: 'delete',
            token: token,
        };

        const send = await this.emailService.reqMatchEmail(emailRequest);

        return send;
    }

    /**
     * 이메일 수락 후 경기 삭제
     * @param  deletematchDto
     * @param  matchId
     * @returns
     */
    async deleteMatch(deletematchDto: deleteMatchDto, matchId: number) {
        const payload = await this.jwtService.verify(deletematchDto.token, {
            secret: this.configService.get<string>('JWT_SECRET'),
        });
        const user = await this.userRepository.findOne({
            where: { id: payload.userId },
        });

        if (!user) {
            throw new UnauthorizedException('사용자 정보가 유효하지 않습니다.');
        }

        // 구단주 체크
        const homeCreator = await this.verifyTeamCreator(user.id);

        await this.verifyOneMatch(matchId, homeCreator[0].id);

        const queryRunner = this.dataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            await queryRunner.manager.delete('match_results', { match_id: matchId });
            await queryRunner.manager.delete('matches', { id: matchId });

            await queryRunner.commitTransaction();

            return;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            console.log(`error : ${error}`);
            if (error instanceof HttpException) {
                // HttpException을 상속한 경우(statusCode 속성이 있는 경우)
                throw error;
            } else {
                // 그 외의 예외
                throw new InternalServerErrorException('서버 에러가 발생했습니다.');
            }
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * 경기 결과 (팀) 정보 가져오기
     * @param  teamId
     * @returns
     */
    async getTeamMatchResult(matchId: number, teamId: number) {
        const team = await this.matchResultRepository.findOne({
            where: {
                match_id: matchId,
                team_id: teamId,
            },
            relations: {
                match: true,
            },
        });

        if (!team) {
            throw new BadRequestException('경기 결과 (팀) 정보가 없습니다.');
        }

        return team;
    }

    /**
     * 경기 결과 등록
     * @param  userId
     * @param  matchId
     * @param  creatematchResultDto
     * @returns
     */
    async resultMatchCreate(
        userId: number,
        matchId: number,
        creatematchResultDto: createMatchResultDto,
    ) {
        // 경기가 끝났는지 체크
        await this.findIfMatchOver(matchId);

        // 구단주 체크
        const homeCreator = await this.verifyTeamCreator(userId);

        const match = await this.verifyOneMatch(matchId, homeCreator[0].id);

        const matchDetail = await this.isMatchDetail(matchId, homeCreator[0].id);

        if (matchDetail) {
            throw new NotFoundException('이미 경기 결과 등록했습니다.');
        }

        // 경기 결과 멤버 체크
        console.log('here');
        await this.chkResultMember(userId, matchId, creatematchResultDto);
        console.log('here2');
        //await this.chkResultMember(userId, matchId, creatematchResultDto);

        //경기 결과
        const matchResult = this.matchResultRepository.create({
            match_id: matchId,
            team_id: homeCreator[0].id,
            corner_kick: creatematchResultDto.cornerKick,
            substitions: creatematchResultDto.substitions,
            passes: creatematchResultDto.passes,
            penalty_kick: creatematchResultDto.penaltyKick,
            free_kick: creatematchResultDto.freeKick,
            clean_sheet: false, // 기본적으로 false로 설정
        });

        if (!matchResult) {
            throw new NotFoundException('경기결과 기록을 생성할 수 없습니다.');
        }

        // 위 생성한 데이터 저장
        const queryRunner = this.dataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            await queryRunner.manager.save('match_results', matchResult);

            await queryRunner.commitTransaction();

            return matchResult;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            if (error instanceof HttpException) {
                // HttpException을 상속한 경우(statusCode 속성이 있는 경우)
                throw error;
            } else {
                // 그 외의 예외
                throw new InternalServerErrorException('서버 에러가 발생했습니다.');
            }
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * 경기 결과 (팀내 선수 전체) 정보 가져오기
     * @param  teamId
     * @param  matchId
     * @returns
     */
    async getMembersMatchResult(matchId: number, teamId: number) {
        const memberStats = await this.playerStatsRepository.find({
            where: {
                match_id: matchId,
                team_id: teamId,
            },
        });

        if (!memberStats) {
            throw new BadRequestException('경기 결과 (선수) 정보가 없습니다.');
        }

        return memberStats;
    }

    /**
     * 경기 후 선수 기록 등록
     * @param  userId
     * @param  matchId
     * @param  memberId
     * @param  createplayerStatsDto
     * @returns
     */
    async resultPlayerCreate(
        userId: number,
        matchId: number,
        memberId: number,
        createplayerStatsDto: createPlayerStatsDto,
    ) {
        // 경기가 끝났는지 체크
        await this.findIfMatchOver(matchId);

        // 구단주 체크
        const homeCreator = await this.verifyTeamCreator(userId);

        const match = await this.verifyOneMatch(matchId, homeCreator[0].id);

        // 해당팀의 멤버인지 체크
        await this.isTeamMember(homeCreator[0].id, memberId);

        const playerStats = this.playerStatsRepository.create({
            team_id: homeCreator[0].id,
            clean_sheet: createplayerStatsDto.clean_sheet,
            match_id: match.id,
            member_id: memberId,
            assists: createplayerStatsDto.assists,
            goals: createplayerStatsDto.goals,
            yellow_cards: createplayerStatsDto.yellowCards,
            red_cards: createplayerStatsDto.redCards,
            substitutions: createplayerStatsDto.substitions,
            save: createplayerStatsDto.save,
        });

        if (!playerStats) {
            throw new NotFoundException('경기결과 기록을 생성할 수 없습니다.');
        }

        await this.playerStatsRepository.save(playerStats);

        return playerStats;
    }

    /**
     * 선수 기록 저장 및 팀별 기록 업데이트
     * @param  userId
     * @param  matchId
     * @param  memberId
     * @param  createplayerStatsDto
     * @returns
     */
    async resultMathfinal(userId: number, matchId: number, resultMembersDto: ResultMembersDto) {
        // 경기가 끝났는지 체크
        await this.findIfMatchOver(matchId);

        // 구단주 체크
        const homeCreator = await this.verifyTeamCreator(userId);

        const match = await this.verifyOneMatch(matchId, homeCreator[0].id);

        // goals 정보를 담을 배열 초기화
        let goalsArray = [];
        let assistsArray = [];
        let yellowCardsArray = [];
        let redCardsArray = [];
        let savesArray = [];

        let goalsCount = 0;

        const matches = await this.matchResultRepository.find({ where: { match_id: matchId } });

        const queryRunner = this.dataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            for (const resultMemberDto of resultMembersDto.results) {
                // 각 DTO에서 필요한 데이터 추출
                const memberId = resultMemberDto.memberId;

                const goals = resultMemberDto.goals;
                const assists = resultMemberDto.assists;
                const yellowCards = resultMemberDto.yellowCards;
                const redCards = resultMemberDto.redCards;
                const saves = resultMemberDto.save;

                // 해당 팀의 멤버인지 체크
                await this.isTeamMember(homeCreator[0].id, memberId);

                // DTO를 사용하여 데이터베이스에 저장
                const playerStats = this.playerStatsRepository.create({
                    team_id: homeCreator[0].id,
                    match_id: match.id,
                    member_id: memberId,
                    assists,
                    goals,
                    yellow_cards: yellowCards,
                    red_cards: redCards,
                    save: saves,
                });

                if (!playerStats) {
                    throw new NotFoundException('경기결과 기록을 생성할 수 없습니다.');
                }

                if (goals > 0) {
                    goalsArray.push({ memberId, count: goals });
                    goalsCount += goals;
                }

                if (assists > 0) {
                    assistsArray.push({ memberId, count: assists });
                }

                if (yellowCards > 0) {
                    yellowCardsArray.push({ memberId, count: yellowCards });
                }

                if (redCards > 0) {
                    redCardsArray.push({ memberId, count: redCards });
                }

                if (saves > 0) {
                    savesArray.push({ memberId, count: saves });
                }

                // 데이터베이스에 저장
                await queryRunner.manager.save(playerStats);
            }

            const matchResultCount = await this.matchResultCount(matchId);

            let this_clean_sheet = false;
            let other_clean_sheet = false;

            // 한 팀이 등록한 상태라면 팀 스탯 생성
            if (matchResultCount.count === 2) {
                // 모든 경기 결과에서 goals이 null이 아닌지 확인
                const allGoalsNotNull = matches.every((match) => match.goals !== null);

                console.log('allGoalsNotNull:', allGoalsNotNull);

                if (allGoalsNotNull) {
                    // 모든 goals의 값이 null이 아닌 경우의 처리를 여기에 작성합니다.
                    throw new NotFoundException('이미 경기결과가 집계 되었습니다.');
                }

                const otherTeam = await this.matchResultRepository.findOne({
                    where: { match_id: matchId, team_id: Not(homeCreator[0].id) },
                });

                let this_score = goalsCount;
                let other_score = otherTeam.goals.reduce((total, goal) => total + goal.count, 0);

                let this_win = 0;
                let this_lose = 0;
                let this_draw = 0;

                let other_win = 0;
                let other_lose = 0;
                let other_draw = 0;

                if (this_score > other_score) {
                    this_win += 1;
                    other_lose += 1;
                } else if (this_score < other_score) {
                    other_win += 1;
                    this_lose += 1;
                } else {
                    this_draw += 1;
                    other_draw += 1;
                }

                if (other_score === 0) this_clean_sheet = true;
                if (this_score === 0) other_clean_sheet = true;

                // 홈팀 스탯 생성
                const getThisTeamStats = await this.teamTotalGames(homeCreator[0].id);

                const thisTeamStats = await this.teamStatsRepository.findOne({
                    where: { team_id: homeCreator[0].id },
                });

                let thisTeamStatsWins = 0;
                let thisTeamStatsLoses = 0;
                let thisTeamStatsDraws = 0;

                // thisTeamStats가 존재하면 기존 wins 값에 this_win을 더함
                if (thisTeamStats) {
                    thisTeamStatsWins = thisTeamStats.wins + this_win;
                    thisTeamStatsLoses = thisTeamStats.loses + this_lose;
                    thisTeamStatsDraws = thisTeamStats.draws + this_draw;

                    await this.teamStatsRepository.update(
                        {
                            team_id: homeCreator[0].id,
                            id: thisTeamStats.id,
                        },
                        {
                            wins: thisTeamStatsWins,
                            loses: thisTeamStatsLoses,
                            draws: thisTeamStatsDraws,
                            total_games: getThisTeamStats ? getThisTeamStats.total_games + 1 : 1,
                        },
                    );
                } else {
                    // thisTeamStats가 존재하지 않으면 this_win만 사용
                    thisTeamStatsWins = this_win;
                    thisTeamStatsLoses = this_lose;
                    thisTeamStatsDraws = this_draw;

                    const thisTeamResult = await this.teamStatsRepository.create({
                        team_id: homeCreator[0].id,
                        wins: thisTeamStatsWins,
                        loses: thisTeamStatsLoses,
                        draws: thisTeamStatsDraws,
                        total_games: 1,
                    });

                    await queryRunner.manager.save('team_statistics', thisTeamResult);
                }

                // 상대팀 스탯 생성
                const getOtherTeamStats = await this.teamTotalGames(otherTeam.team_id);

                const otherTeamStats = await this.teamStatsRepository.findOne({
                    where: { team_id: otherTeam.team_id },
                });

                let otherTeamStatsWins = 0;
                let otherTeamStatsLoses = 0;
                let otherTeamStatsDraws = 0;

                // thisTeamStats가 존재하면 기존 wins 값에 this_win을 더함
                if (otherTeamStats) {
                    otherTeamStatsWins = otherTeamStats.wins + other_win;
                    otherTeamStatsLoses = otherTeamStats.loses + other_lose;
                    otherTeamStatsDraws = otherTeamStats.draws + other_draw;

                    await queryRunner.manager.update(
                        'team_statistics',
                        {
                            team_id: otherTeam.team_id,
                            id: otherTeamStats.id,
                        },
                        {
                            wins: otherTeamStatsWins,
                            loses: otherTeamStatsLoses,
                            draws: otherTeamStatsDraws,
                            total_games: getOtherTeamStats ? getOtherTeamStats.total_games + 1 : 1,
                        },
                    );
                } else {
                    // thisTeamStats가 존재하지 않으면 this_win만 사용
                    otherTeamStatsWins = other_win;
                    otherTeamStatsLoses = other_lose;
                    otherTeamStatsDraws = other_draw;

                    const otherTeamResult = await this.teamStatsRepository.create({
                        team_id: otherTeam.team_id,
                        wins: otherTeamStatsWins,
                        loses: otherTeamStatsLoses,
                        draws: otherTeamStatsDraws,
                        total_games: 1,
                    });

                    await queryRunner.manager.save('team_statistics', otherTeamResult);
                }

                await queryRunner.manager.update(
                    'match_results',
                    { match_id: matchId, team_id: otherTeam.team_id },
                    {
                        clean_sheet: other_clean_sheet,
                    },
                );
            }

            await queryRunner.manager.update(
                'match_results',
                { match_id: matchId, team_id: homeCreator[0].id },
                {
                    goals: goalsArray,
                    assists: assistsArray,
                    yellow_cards: yellowCardsArray,
                    red_cards: redCardsArray,
                    saves: savesArray,
                    clean_sheet: this_clean_sheet,
                },
            );

            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            if (error instanceof HttpException) {
                // HttpException을 상속한 경우(statusCode 속성이 있는 경우)
                throw error;
            } else {
                // 그 외의 예외
                console.log('error:', error);
                throw new InternalServerErrorException('서버 에러가 발생했습니다.');
            }
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * 팀 전체 경기 일정 조회
     * @param  teamId
     * @returns
     */
    async findTeamMatches(teamId: number) {
        const teamMatches = await this.matchRepository.findOne({
            where: [{ home_team_id: teamId }, { away_team_id: teamId }],
        });

        if (!teamMatches) {
            throw new NotFoundException('팀에서 진행한 경기가 없습니다.');
        }

        return teamMatches;
    }

    /**
     * 경기 세부 조회
     * @param  matchId
     * @returns
     */
    async findMatchDetail(matchId: number) {
        const teamMatches = await this.matchResultRepository.find({
            where: { match_id: matchId },
        });

        if (!teamMatches) {
            throw new NotFoundException('경기 기록이 없습니다.');
        }

        return teamMatches;
    }

    /**
     * 구단주 검증
     * @param  userId
     * @returns
     */
    async verifyTeamCreator(userId: number) {
        const creator = await this.teamRepository
            .createQueryBuilder('team')
            .select([
                'team.id',
                'team.creator_id',
                'team.name',
                'team.imageUUID',
                'team.location_id',
            ])
            .where('team.creator_id=:userId', { userId })
            .getMany();

        console.log('userId:', userId);
        console.log('creator:', creator);

        if (!creator[0]) {
            throw new BadRequestException('구단주가 아닙니다.');
        }

        const user = await this.getUserInfo(userId);

        const imageUrl = await this.awsService.presignedUrl(creator[0].imageUUID);

        // creator 배열의 각 요소에 user.email 추가
        const updatedCreator = creator.map((item) => ({
            ...item,
            email: user.email,
            imageUrl,
            user_id: user.id,
        }));

        return updatedCreator;
    }

    /**
     * 팀 정보 가져오기
     * @param  teamId
     * @returns
     */
    private async getTeamInfo(teamId: number) {
        const team = await this.teamRepository.findOne({
            where: {
                id: teamId,
            },
            relations: {
                creator: true,
            },
            select: {
                creator: {
                    name: true,
                    email: true,
                },
            },
        });

        if (!team) {
            throw new BadRequestException('팀 정보가 없습니다.');
        }

        return team;
    }

    /**
     * 경기 일정 조회+요청자 팀 검증
     * @param  matchId
     * @param  teamId
     * @returns
     */
    async verifyOneMatch(matchId: number, teamId: number) {
        const match = await this.matchRepository
            .createQueryBuilder('match')
            .where('match.id = :matchId', { matchId })
            .andWhere(
                new Brackets((qb) => {
                    qb.where('match.home_team_id = :teamId', { teamId }).orWhere(
                        'match.away_team_id = :teamId',
                        { teamId },
                    );
                }),
            )
            .getOne();

        if (!match) {
            throw new NotFoundException('해당 ID의 경기 일정 및 경기 등록자인지 확인바랍니다.');
        }

        return match;
    }

    /**
     * 경기 후 팀 스탯 생성
     * @param  matchResult
     * @returns
     */
    async createTeamStats(matchResult: any) {
        const match = await this.findOneMatch(matchResult.match_id);

        if (!match) {
            throw new NotFoundException('해당 ID의 경기 일정 및 경기 등록자인지 확인바랍니다.');
        }

        const home_team_id = match.home_team_id;
        const away_team_id = match.away_team_id;

        const home_result = await this.isMatchDetail(match.id, home_team_id);
        const away_result = await this.isMatchDetail(match.id, away_team_id);

        let home_score = 0;
        let away_score = 0;

        if (!home_result) {
            console.log(`홈 없음`);
            home_score = matchResult.goals.reduce((total, goal) => total + goal.count, 0);
            away_score = away_result.goals.reduce((total, goal) => total + goal.count, 0);
        } else {
            console.log(`어웨이 없음`);
            home_score = home_result.goals.reduce((total, goal) => total + goal.count, 0);
            away_score = matchResult.goals.reduce((total, goal) => total + goal.count, 0);
        }

        let home_win = 0;
        let home_lose = 0;
        let home_draw = 0;

        let away_win = 0;
        let away_lose = 0;
        let away_draw = 0;

        if (home_score > away_score) {
            home_win += 1;
            away_lose += 1;
        } else if (home_score < away_score) {
            away_win += 1;
            home_lose += 1;
        } else {
            home_draw += 1;
            away_draw += 1;
        }

        return {
            home_win,
            home_lose,
            home_draw,
            home_score,
            away_win,
            away_lose,
            away_draw,
            away_score,
        };
    }

    /**
     * 경기 후 팀 기록 멤버 체크
     * @param  matchId
     * @param  teamId
     * @returns
     */
    async chkResultMember(
        userId: number,
        matchId: number,
        creatematchResultDto: createMatchResultDto,
    ) {
        // 구단주 체크
        const homeCreator = await this.verifyTeamCreator(userId);

        const teamId = homeCreator[0].id;

        /*
        // 골 멤버 체크
        creatematchResultDto.goals.forEach((x) => {
            this.isTeamMember(teamId, x.playerId);
        });

        // 레드카드 멤버 체크
        creatematchResultDto.redCards.forEach((x) => {
            this.isTeamMember(teamId, x.playerId);
        });

        // 옐로우카드 멤버 체크
        creatematchResultDto.yellowCards.forEach((x) => {
            this.isTeamMember(teamId, x);
        });*/

        // 교체 멤버 체크 ?? 교체 멤버가 없는 경우는??
        console.log('교체 체크');
        // creatematchResultDto.substitions.forEach((x) => {
        //     this.isTeamMember(teamId, x.inPlayerId);
        //     this.isTeamMember(teamId, x.outPlayerId);
        // });

        /*
        // 선방 멤버 체크
        creatematchResultDto.saves.forEach((x) => {
            this.isTeamMember(teamId, x.playerId);
        });

        // 어시스트 멤버 체크
        creatematchResultDto.assists.forEach((x) => {
            this.isTeamMember(teamId, x.playerId);
        });*/
    }

    /**
     * 경기장 전체 조회
     * @returns
     */
    async findAllSoccerField() {
        const soccerField = await this.soccerFieldRepository.find({
            relations: {
                locationfield: true,
            },
            select: {
                locationfield: {
                    address: true,
                    state: true,
                    city: true,
                    district: true,
                },
            },
        });

        if (!soccerField) {
            throw new NotFoundException('등록된 경기장 목록이 없습니다.');
        }

        return soccerField;
    }

    /**
     * 예약 가능 시간 조회
     * @param  date
     * @returns
     */
    async findAvailableTimes(date: string, locationId: number) {
        const matches = await this.matchRepository.find({
            where: { date },
        });

        const soccerFieldData = await this.soccerFieldRepository.findOne({
            where: { location_id: locationId },
        });

        const times = ['10:00:00', '12:00:00', '14:00:00', '16:00:00', '18:00:00', '20:00:00'];
        const availableTimes = times.map((time) => {
            const isBooked = matches.some(
                (match) => match.time === time && match.soccer_field_id === soccerFieldData.id,
            );
            return {
                time,
                status: isBooked ? '예약 불가' : '예약 가능',
            };
        });

        return availableTimes;
    }

    /**
     * 구단주 전체 명단 조회
     * @returns
     */
    async getTeamOwners(userId: number) {
        const teamOwners = await this.teamRepository.find({
            relations: {
                creator: true,
            },
            select: {
                id: true,
                imageUUID: true,
                name: true,
                gender: true,
                description: true,
                creator: {
                    id: true,
                    email: true,
                    name: true,
                },
            },

            where: {
                creator: {
                    id: Not(userId),
                },
            },
        });

        if (!teamOwners.length) {
            // 배열의 길이를 확인하는 것으로 변경
            throw new BadRequestException('구단주 명단이 없습니다.');
        }

        // 각 팀 소유주의 imageUrl을 가져오기 위한 로직
        const teamOwnersWithImageUrl = await Promise.all(
            teamOwners.map(async (teamOwner) => {
                let imageUrl = '';
                if (teamOwner.imageUUID) {
                    imageUrl = await this.awsService.presignedUrl(teamOwner.imageUUID);
                }
                // 객체 분해 할당을 사용하여 teamOwner 객체에 imageUrl 추가
                return { ...teamOwner, imageUrl };
            }),
        );

        return teamOwnersWithImageUrl;
    }

    async isMatchDetail(matchId: number, teamId: number) {
        const teamMatches = await this.matchResultRepository.findOne({
            where: { match_id: matchId, team_id: teamId },
        });

        return teamMatches;
    }

    /**
     * 팀별 일정 조회
     * @param  teamId
     * @returns
     */
    async getTeamSchedule(teamId: number, userId: number) {
        //팀의 멤버인지 검증
        await this.isTeamMemberByUserId(teamId, userId);

        const rawResults = await this.dataSource.query(`
        SELECT 
            f.field_name, 
            DATE_FORMAT(m.date, '%Y-%m-%d') AS date,
            t.image_uuid,
            t.name,
            m.time,
            m.id AS match_id
        FROM 
            matches AS m
            LEFT JOIN team AS t ON m.away_team_id = t.id
            LEFT JOIN soccer_fields AS f ON m.soccer_field_id = f.id
        WHERE 
            m.home_team_id = ${teamId}
        
        UNION
        
        SELECT 
            f.field_name, 
            DATE_FORMAT(m.date, '%Y-%m-%d') AS date,
            t.image_uuid,
            t.name,
            m.time,
            m.id AS match_id
        FROM 
            matches AS m
            LEFT JOIN team AS t ON m.home_team_id = t.id
            LEFT JOIN soccer_fields AS f ON m.soccer_field_id = f.id
        WHERE 
            m.away_team_id = ${teamId}
        `);

        const resultsWithImageUrl = await Promise.all(
            rawResults.map(async (match) => {
                const imageUrl = match.image_uuid
                    ? await this.awsService.presignedUrl(match.image_uuid)
                    : '';
                return { ...match, imageUrl };
            }),
        );

        return resultsWithImageUrl;
    }

    /**
     * 개인 멤버정보 조회
     * @returns
     */
    async getMember(userId: number) {
        const member = await this.memberRepository.findOne({
            relations: {
                user: {
                    profile: true,
                },
                team: true,
                playerstats: {
                    match: true,
                },
            },
            select: {
                user: {
                    id: true,
                    email: true,
                    name: true,
                    profile: {
                        id: true,
                        skillLevel: true,
                        weight: true,
                        height: true,
                        preferredPosition: true,
                        imageUrl: true,
                        age: true,
                        phone: true,
                        birthdate: true,
                        gender: true,
                        name: true,
                    },
                },
                team: {
                    id: true,
                },
                playerstats: {
                    id: true,
                    clean_sheet: true,
                    assists: true,
                    goals: true,
                    yellow_cards: true,
                    red_cards: true,
                    substitutions: true,
                    save: true,
                    match_id: true,
                    match: {
                        id: true,
                        date: true,
                        time: true,
                        soccer_field_id: true,
                        home_team_id: true,
                        away_team_id: true,
                        result: true,
                    },
                },
            },

            where: {
                user: {
                    id: userId,
                },
            },
        });

        if (!member) {
            throw new BadRequestException('멤버 정보가 없습니다.');
        }

        return member;
    }

    /**
     * 경기별 팀별 멤버 조회
     * @returns
     */
    async getTeamMembers(matchId: number, teamId: number) {
        const findMembers = await this.memberRepository.find({
            select: {
                id: true,
                user: {
                    id: true,
                    name: true,
                    email: true,
                },
                matchformation: {
                    position: true,
                },
            },
            where: {
                team: {
                    id: teamId,
                },
                matchformation: {
                    team_id: teamId,
                    match_id: matchId,
                },
            },
            relations: {
                team: true,
                user: true,
                matchformation: true,
            },
        });

        return findMembers;
    }

    async isTeamMemberByUserId(teamId: number, userId: number) {
        const member = await this.memberRepository
            .createQueryBuilder('members')
            .where('members.team_id = :teamId', { teamId })
            .andWhere('members.user_id = :userId', { userId })
            .getOne();

        if (!member) {
            throw new NotFoundException('팀의 멤버가 아닙니다.');
        }

        return member;
    }

    async isTeamMember(teamId: number, memberId: number) {
        const member = await this.memberRepository
            .createQueryBuilder('members')
            .where('members.team_id = :teamId', { teamId })
            .andWhere('members.id = :memberId', { memberId })
            .getOne();

        if (!member) {
            throw new NotFoundException('팀의 멤버가 아닙니다.');
        }

        return member;
    }

    private async teamTotalGames(teamId: number) {
        const teamStats = await this.teamStatsRepository.findOne({
            select: ['wins', 'loses', 'draws', 'total_games'],
            where: { team_id: teamId },
        });

        if (!teamStats) {
            return {
                wins: 0,
                loses: 0,
                draws: 0,
                total_games: 0,
            };
        }

        return teamStats;
    }

    private async getUserInfo(userId: number) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
        });

        return user;
    }

    async verifyReservedMatch(date: string, time: string) {
        const existMatch = await this.matchRepository.findOne({
            where: { date, time },
        });
        if (existMatch) {
            throw new BadRequestException('이미 예약된 경기 일정 입니다.');
        }
        return existMatch;
    }

    async matchResultCount(matchId: number) {
        const count = await this.matchResultRepository.count({
            where: { match_id: matchId },
        });

        let team = {};

        if (count > 0) {
            team = await this.matchResultRepository.findOne({
                where: { match_id: matchId },
            });
        }

        return { count, team };
    }
}
