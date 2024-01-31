import { HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MatchFormation } from '../formation/entities/formation.entity';
import { DataSource, Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { UpdateFormationDto } from './dtos/update-formation.dto';
import { Member } from '../member/entities/member.entity';

@Injectable()
export class FormationService {
    constructor(
        @InjectRepository(MatchFormation)
        private matchFormationRepository: Repository<MatchFormation>,

        @InjectRepository(User)
        private userRepository: Repository<User>,

        @InjectRepository(Member)
        private memberRepository: Repository<Member>,

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
        
          const matchFormation = await this.matchFormationRepository.find({
            where: whereCondition,
            relations: {
              member: true,
            },
          });

        if (!matchFormation) {
            throw new NotFoundException('팀별 포메이션 정보가 없습니다.');
        }

        
        // 각 member에 대해 user 정보를 불러옵니다.
        for (const formation of matchFormation) {
            if (formation.member) {
                const memberInfo = await this.memberRepository.findOne({
                    where:{
                        id:formation.member.id
                    },relations:{
                        user:true
                    }
                });

                formation.member.user = memberInfo.user; // 여기서 user 정보를 member 객체에 할당
            }
        }

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

        console.log('matchFormation:',matchFormation.length);

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
                const playerFormation = this.matchFormationRepository.create({
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
}
