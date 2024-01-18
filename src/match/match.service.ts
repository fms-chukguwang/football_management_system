import { BadRequestException, HttpException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { createMatchDto } from './dtos/create-match.dto';
import { Match } from './entities/match.entity';
import { updateMatchDto } from './dtos/update-match.dto';
import { EmailService } from 'src/email/email.service';
import { EmailRequest } from './dtos/email-request.dto';
import { AuthService } from 'src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/user/entities/user.entity';
import { deleteMatchDto } from './dtos/delete-match.dto';
import { deleteRequestDto } from './dtos/delete-request.dto';
import { createRequestDto } from './dtos/create-request.dto';
import { updateRequestDto } from './dtos/update-request.dto';
import { createMatchResultDto } from './dtos/result-match.dto';
import { MatchResult } from './entities/match-result.entity';
import { createPlayerStatsDto } from './dtos/player-stats.dto';
import { PlayerStats } from './entities/player-stats.entity';
import { TeamStats } from './entities/team-stats.entity';

@Injectable()
export class MatchService {

    constructor(
        @InjectRepository(Match)
        private matchRepository: Repository<Match>,

        @InjectRepository(User)
        private userRepository: Repository<User>,

        @InjectRepository(MatchResult)
        private matchResultRepository: Repository<MatchResult>,

        @InjectRepository(PlayerStats)
        private playerStatsRepository: Repository<PlayerStats>,

        @InjectRepository(TeamStats)
        private teamStatsRepository: Repository<TeamStats>,

        private emailService: EmailService,
        private authService: AuthService,
        private jwtService: JwtService,
        private configService: ConfigService,
        private readonly dataSource: DataSource,
      ) {}

    // 경기 생성 요청(상대팀 구단주에게)
    async requestCreMatch(userId: number, createrequestDto:createRequestDto) {

        const token = this.authService.generateAccessEmailToken(userId);

        //TODO 입력자 구단주 체크하는 메서드 추가

        // EmailRequest 객체 생성 및 초기화
        const emailRequest: EmailRequest = {
            email: "codzero00@gmail.com", // TODO 상대팀 구단주의 이메일 가져와서 집어넣기
            subject: "경기 일정 생성 요청",
            clubName: 'FC 예시',    // TODO 상대팀 코드로 팀명 가져와서 집어넣기
            originalSchedule: `${createrequestDto.date} ${createrequestDto.time}`,
            newSchedule: `${createrequestDto.date} ${createrequestDto.time}`,
            reason: '경기 제안',
            homeTeamId:createrequestDto.homeTeamId,
            awayTeamId:createrequestDto.awayTeamId,
            fieldId:createrequestDto.fieldId,
            senderName: 'FC 예시 관리자', // TODO 본인팀 코드로 팀명 가져와서 집어넣기
            url: `http://localhost:3000/api/match/book/accept`,
            chk: 'create',
            token:token
        };

        const send = await this.emailService.reqMatchEmail(emailRequest);

        return send ;
    }

    // 실제 경기 생성
    async createMatch(creatematchDto:createMatchDto) {

        const payload = await this.jwtService.verify(creatematchDto.token, {
            secret: this.configService.get<string>("JWT_SECRET"),
        });
        const user = await this.userRepository.findOne({
            where: { id: payload.userId },
        });

        if(!user){
            throw new UnauthorizedException('사용자 정보가 유효하지 않습니다.');
        }

        //TODO 입력자 구단주 체크하는 메서드 추가

        const matchDate = creatematchDto.date;
        const matchTime = creatematchDto.time;

        //입력한 일자, 시간 예약 여부 체크
        await this.verifyReservedMatch(matchDate,matchTime);

        const match = this.matchRepository.create({
                        owner_id:user.id,
                        date:matchDate,
                        time:matchTime,
                        home_team_id:Number(creatematchDto.homeTeamId),
                        away_team_id:Number(creatematchDto.awayTeamId),
                        soccer_field_id:Number(creatematchDto.fieldId)
                    });

        if (!match) {
            throw new NotFoundException('경기를 생성할 수 없습니다.');
        }
        
        await this.matchRepository.save(match);

        return match;
    
    }

    async findOneMatch(matchId: number) {
        const match = await this.matchRepository.findOne({
            where: { id:matchId },
        });

        if(!match){
            throw new NotFoundException('해당 ID의 경기 일정이 없습니다.');
        }

        return match;
    }

    // 경기 수정 요청(상대팀 구단주에게)
    async requestUptMatch(userId: number, matchId:number,updaterequestDto:updateRequestDto) {

        const token = this.authService.generateAccessEmailToken(userId);

        //TODO 입력자 구단주 체크하는 메서드 추가

        const match = await this.findOneMatch(matchId);

        // EmailRequest 객체 생성 및 초기화
        const emailRequest: EmailRequest = {
            email: "codzero00@gmail.com", // TODO 상대팀 구단주의 이메일 가져와서 집어넣기
            subject: "경기 일정 수정 요청",
            clubName: 'FC 예시',    // TODO 상대팀 코드로 팀명 가져와서 집어넣기
            originalSchedule: `${match.date} ${match.time}`,
            newSchedule: `${updaterequestDto.date} ${updaterequestDto.time}`,
            reason: updaterequestDto.reason,
            homeTeamId:0,
            awayTeamId:0,
            fieldId:0,
            senderName: 'FC 예시 관리자', // TODO 본인팀 코드로 팀명 가져와서 집어넣기
            url: `http://localhost:3000/api/match/${matchId}/update`,
            chk: 'update',
            token:token
        };

        const send = await this.emailService.reqMatchEmail(emailRequest);

        return send ;
    }

    async updateMatch(matchId:number,updatematchDto:updateMatchDto) {

        const payload = await this.jwtService.verify(updatematchDto.token, {
            secret: this.configService.get<string>("JWT_SECRET"),
        });
        const user = await this.userRepository.findOne({
            where: { id: payload.userId },
        });

        if(!user){
            throw new UnauthorizedException('사용자 정보가 유효하지 않습니다.');
        }

        //TODO 입력자 구단주 체크하는 메서드 추가


        await this.findOneMatch(matchId);

        const updateMatch = await this.matchRepository.update(
                        { id: matchId },
                        {
                            date: updatematchDto.date,
                            time: updatematchDto.time,
                        },
                    );

        return updateMatch;
    }

    // 경기 삭제 요청(상대팀 구단주에게)
    async requestDelMatch(userId: number, matchId:number,deleterequestDto:deleteRequestDto) {

        const token = this.authService.generateAccessEmailToken(userId);

        //TODO 입력자 구단주 체크하는 메서드 추가

        const match = await this.findOneMatch(matchId);

        // EmailRequest 객체 생성 및 초기화
        const emailRequest: EmailRequest = {
            email: "codzero00@gmail.com",
            subject: "경기 일정 삭제 요청",
            clubName: 'FC 예시',
            originalSchedule: `${match.date} ${match.time}`,
            newSchedule: ``,
            reason: deleterequestDto.reason,
            homeTeamId:0,
            awayTeamId:0,
            fieldId:0,
            senderName: 'FC 예시 관리자',
            url: `http://localhost:3000/api/match/${matchId}/delete`, //TODO url 전송시 qeury에 스케줄, matchId 보내기?
            chk: 'delete',
            token:token
        };

        const send = await this.emailService.reqMatchEmail(emailRequest);

        return send ;
    }

    async deleteMatch(deletematchDto: deleteMatchDto, matchId: number) {

        const payload = await this.jwtService.verify(deletematchDto.token, {
            secret: this.configService.get<string>("JWT_SECRET"),
        });
        const user = await this.userRepository.findOne({
            where: { id: payload.userId },
        });

        if(!user){
            throw new UnauthorizedException('사용자 정보가 유효하지 않습니다.');
        }

        //TODO 입력자 구단주 체크하는 메서드 추가

        await this.findOneMatch(matchId);

        const queryRunner = this.dataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try{

            await queryRunner.manager.delete('match_results', { match_id:matchId });
            await queryRunner.manager.delete('matches', { id:matchId });

            await queryRunner.commitTransaction();

            return;

        }catch(error){
            await queryRunner.rollbackTransaction();
            console.log(`error : ${error}`);
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


    }

    // 경기 결과 등록
    async resultMatchCreate(userId: number, matchId:number, creatematchResultDto:createMatchResultDto) {

        //TODO 입력자 구단주 체크하는 메서드 추가하기

        const match = await this.findOneMatch(matchId);

        const matchDetail = await this.isMatchDetail(matchId);

        if(matchDetail){
            throw new NotFoundException('이미 경기 결과 등록했습니다.');
        }

        // 홈팀 경기 결과
        const matchHomeResult = this.matchResultRepository.create({
            date:match.date,
            time:match.time,
            match_id:matchId,
            owner_id:userId,
            soccer_field_id:match.soccer_field_id,
            team_id:match.home_team_id,
            win:creatematchResultDto.homeWin,
            lose:creatematchResultDto.homeLose,
            draw:creatematchResultDto.homeDraw,
            red_cards:creatematchResultDto.homeRedCards,
            yellow_cards:creatematchResultDto.homeYellowCards,
            substitions:creatematchResultDto.homeSubstitions,
            save:creatematchResultDto.homeSave,
            intercept:creatematchResultDto.homeIntercept
        });

        // 어웨이팀 경기 결과
        const matchAwayResult = this.matchResultRepository.create({
            date:match.date,
            time:match.time,
            match_id:matchId,
            owner_id:userId,
            soccer_field_id:match.soccer_field_id,
            team_id:match.away_team_id,
            win:creatematchResultDto.awayWin,
            lose:creatematchResultDto.awayLose,
            draw:creatematchResultDto.awayDraw,
            red_cards:creatematchResultDto.awayRedCards,
            yellow_cards:creatematchResultDto.awayYellowCards,
            substitions:creatematchResultDto.awaySubstitions,
            save:creatematchResultDto.awaySave,
            intercept:creatematchResultDto.awayIntercept
        });

        
        // 홈팀 스탯 생성
        const homeTeamTotalGames = await this.findTeamStats(match.home_team_id);
        const homeTeamResult = this.teamStatsRepository.create({
            team_id:match.home_team_id,
            wins:creatematchResultDto.homeWin,
            loses:creatematchResultDto.homeLose,
            draws:creatematchResultDto.homeDraw,
            total_games: Number(homeTeamTotalGames)+1
        });

        // 어웨이팀 스탯 생성
        const awayTeamTotalGames = await this.findTeamStats(match.away_team_id);
        const awayTeamResult = this.teamStatsRepository.create({
            team_id:match.away_team_id,
            wins:creatematchResultDto.homeLose,
            loses:creatematchResultDto.homeWin,
            draws:creatematchResultDto.homeDraw,
            total_games: Number(awayTeamTotalGames)+1
        });

        if (!matchHomeResult || !matchAwayResult) {
        throw new NotFoundException('경기결과 기록을 생성할 수 없습니다.');
        }

        // 위 생성한 데이터 저장
        const queryRunner = this.dataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try{

            await queryRunner.manager.save('match_results', matchHomeResult);
            await queryRunner.manager.save('match_results', matchAwayResult);
            await queryRunner.manager.save('team_statistics', homeTeamResult);
            await queryRunner.manager.save('team_statistics', awayTeamResult);

            await queryRunner.commitTransaction();

            return matchHomeResult ;

        }catch(error){

            await queryRunner.rollbackTransaction();
            console.log(`error : ${error}`);
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
    }

    // 경기 후 선수 기록 등록
    async resultPlayerCreate(userId: number, matchId:number, memberId:number, createplayerStatsDto: createPlayerStatsDto) {

        //TODO 입력자 구단주 체크하는 메서드 추가하기

        //TODO 플레이어 아이디로 팀 아이디 가져오는 메서드 추가하기

        const match = await this.findOneMatch(matchId);

        const playerStats = this.playerStatsRepository.create({
            team_id:1,  //TODO 위에서 팀id 추후에 가져오기
            match_id: match.id,
            member_id: memberId,
            assists: createplayerStatsDto.assists,
            goals: createplayerStatsDto.goals,
            headings: createplayerStatsDto.headings,
            yellow_cards:createplayerStatsDto.yellowCards,
            red_cards: createplayerStatsDto.redCards,
            substitutions: createplayerStatsDto.substitions,
            save: createplayerStatsDto.save,
            intercepts: createplayerStatsDto.intercepts,
            pass: createplayerStatsDto.pass,
            pass_success: createplayerStatsDto.passSuccess,
            heading_success: createplayerStatsDto.headingSuccess,
            shooting_success: createplayerStatsDto.shootingSuccess,
            shooting: createplayerStatsDto.shooting
        });

        if (!playerStats) {
        throw new NotFoundException('경기결과 기록을 생성할 수 없습니다.');
        }

        await this.playerStatsRepository.save(playerStats);

        return playerStats ;
    }

    // 팀 총 경기 일정 조회
    async findTeamMatches(teamId: number) {
        const teamMatches = await this.matchRepository.findOne({
            where: [
                        { home_team_id:teamId },
                        { away_team_id:teamId }
                    ]

        });

        if (!teamMatches) {
            throw new NotFoundException('팀에서 진행한 경기가 없습니다.');
            }

        return teamMatches;
    }

    // 특정 경기 세부 조회
    async findMatchDetail(matchId: number) {
        const teamMatches = await this.matchResultRepository.findOne({
            where: { match_id:matchId }

        });

        if (!teamMatches) {
            throw new NotFoundException('경기 기록이 없습니다.');
            }

        return teamMatches;
    }

    // 특정 경기 세부 조회(중복 체크용)
    async isMatchDetail(matchId: number) {
        const teamMatches = await this.matchResultRepository.findOne({
            where: { match_id:matchId }

        });

        return teamMatches;
    }

    // 팀 총 경기 횟수
    private async findTeamStats(teamId: number) {
        const teamStats = await this.teamStatsRepository.findOne({
            select: ['total_games'],
            where: { team_id:teamId },
        });

        if(!teamStats){
            return 0;
        }

        return teamStats;
    }

    // 예약일자, 시간 중복 체크
    async verifyReservedMatch(date: string,time:string) {
        const existMatch = await this.matchRepository.findOne({
            where: { date,time },
        });
        if (existMatch) {
            throw new BadRequestException('이미 예약된 경기 일정 입니다.');
        }
        return existMatch;
    }

    // 구단주 검증
    async verifyClubOwner(userId:number) {
        /*
        const clubOwner = await this.userRepository.findOne({
            where: { id:userId },
        });
        if (!clubOwner) {
            throw new BadRequestException('구단주가 아닙니다.');
        }
        return clubOwner;*/
    }


}


