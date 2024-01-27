import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MatchFormation } from './entities/formation.entity';
import { Repository } from 'typeorm';

@Injectable()
export class FormationService {
    constructor(
        @InjectRepository(MatchFormation)
        private matchFormationRepository: Repository<MatchFormation>,
    ) {}

    /**
     * 팀별 포메이션 조회
     * @param  teamId
     * @returns
     */
    async getMatchFormation(teamId: number) {
        const matchFormation = await this.matchFormationRepository.find({
            where: { id: teamId },
        });

        if (!matchFormation) {
            throw new NotFoundException('팀별 포메이션 정보가 없습니다.');
        }

        return matchFormation;
    }

    /**
     * 팀별 포메이션 저장
     * @param  teamId
     * @returns
     */
    async saveMatchFormation(teamId: number) {

        const matchFormation = await this.getMatchFormation(teamId);

        if (!matchFormation) {
            // 팀별 포메이션 정보가 없으면 insert
        }else {
            // 팀별 포메이션 정보가 있으면 update
        }

        return matchFormation;
    }
}
