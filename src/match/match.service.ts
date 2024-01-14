import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createMatchDto } from './dtos/create-match.dto';
import { Match } from './entities/match.entity';
import { updateMatchDto } from './dtos/update-match.dto';
import { EmailService } from 'src/email/email.service';
import { EmailRequest } from './dtos/email-request.dto';

@Injectable()
export class MatchService {

    constructor(
        @InjectRepository(Match)
        private matchRepository: Repository<Match>,

        private emailService: EmailService
      ) {}

    async createMatch(userId:number,creatematchDto:createMatchDto) {

        //TODO 입력자 구단주 체크하는 메서드 추가

        const matchDate = creatematchDto.date;
        const matchTime = creatematchDto.time;

        //입력한 일자, 시간 예약 여부 체크
        await this.verifyReservedMatch(matchDate,matchTime);

        const match = this.matchRepository.create({
                        id:1,
                        owner_id:userId,
                        date:matchDate,
                        time:matchTime,
                        home_team_id:creatematchDto.homeTeamId,
                        away_team_id:creatematchDto.awayTeamId,
                        field_id:creatematchDto.fieldId
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
    async requestUptMatch(userId: number, matchId:number,updatematchDto:updateMatchDto) {

        //TODO 입력자 구단주 체크하는 메서드 추가

        const match = await this.findOneMatch(matchId);

        // EmailRequest 객체 생성 및 초기화
        const emailRequest: EmailRequest = {
            email: "codzero00@gmail.com",
            subject: "경기 일정 수정 요청",
            clubName: 'FC 예시',
            originalSchedule: `${match.date} ${match.time}`,
            newSchedule: `${updatematchDto.date} ${updatematchDto.time}`,
            reason: '날씨 악화 예상',
            senderName: 'FC 예시 관리자',
            url: 'https://www.naver.com', //TODO url 전송시 qeury에 스케줄, matchId 보내기?
            chk: 'update'
        };
                
        const send = await this.emailService.reqMatchEmail(emailRequest);

        return send ;
    }

    async updateMatch(userId: number, matchId:number,updatematchDto:updateMatchDto) {

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
    async requestDelMatch(userId: number, matchId:number) {

        //TODO 입력자 구단주 체크하는 메서드 추가

        const match = await this.findOneMatch(matchId);

        // EmailRequest 객체 생성 및 초기화
        const emailRequest: EmailRequest = {
            email: "codzero00@gmail.com",
            subject: "경기 일정 삭제 요청",
            clubName: 'FC 예시',
            originalSchedule: `${match.date} ${match.time}`,
            newSchedule: ``,
            reason: '장소 대여 문제로 일정 취소',
            senderName: 'FC 예시 관리자',
            url: 'https://www.naver.com', //TODO url 전송시 qeury에 스케줄, matchId 보내기?
            chk: 'delete'
        };

        const send = await this.emailService.reqMatchEmail(emailRequest);

        return send ;
    }

    async deleteMatch(userId: number, matchId: number) {

        //TODO 입력자 구단주 체크하는 메서드 추가

        await this.findOneMatch(matchId);

        await this.matchRepository.delete({id:matchId});

        return;
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


