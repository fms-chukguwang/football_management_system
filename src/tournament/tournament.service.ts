import { Inject, Injectable } from '@nestjs/common';
import { In, LessThan, Repository, EntityManager } from 'typeorm';
import { TournamentModel } from './entities/tournament.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTournamentDto } from './dtos/create-tournament.dto';
import { LoggingService } from 'src/logging/logging.service';
import { TeamModel } from 'src/team/entities/team.entity';
import { UpdateTournamentDto } from './dtos/update-tournament.dto';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class TournamentService {
    constructor(
        @InjectRepository(TournamentModel)
        private tournamentRepository: Repository<TournamentModel>,
        @InjectRepository(TeamModel)
        private teamRepository: Repository<TeamModel>,
        private readonly loggingService: LoggingService,
        private readonly entityManager: EntityManager,
    ) {}

    createTournament(createTournamentDto: CreateTournamentDto) {
        return this.tournamentRepository.save(createTournamentDto);
    }

    async applyTournament(tournamentId: number, teamId: number) {
        // 토너먼트 정보 가져오기
        return await this.entityManager.transaction(async (manager) => {
            const tournament = await manager
                .createQueryBuilder(TournamentModel, 'tournament')
                .setLock('pessimistic_write')
                .leftJoinAndSelect('tournament.teams', 'teams')
                .where('tournament.id = :id', { id: tournamentId })
                .getOne();

            if (!tournament) {
                await this.loggingService.warn(
                    `존재하지 않는 토너먼트 아이디 ${tournamentId}에 신청`,
                );
                return '토너먼트가 존재하지 않습니다.';
            }

            // 신청 마감일 확인
            if (tournament.registerDeadline < new Date()) {
                return '신청 마감일이 지났습니다.';
            }

            // 신청 가능한지 확인
            if (tournament.isFinished) {
                return '신청이 마감 된 토너먼트입니다.';
            }

            // 여석이 있는지 확인
            if (tournament.teams.length >= tournament.teamLimit) {
                tournament.isFinished = true;
                await this.tournamentRepository.save(tournament);
                return '신청이 마감 된 토너먼트입니다.';
            }

            // 팀이 이미 신청했는지 확인
            if (tournament.teams.find((team) => team.id === teamId)) {
                return '이미 신청한 팀입니다.';
            }

            // 신청하기

            const team = await manager.findOne(TeamModel, {
                where: { id: teamId },
            });

            if (!team) {
                throw new Error('존재하지 않는 팀입니다.');
            }

            // TypeORM의 save 메소드를 사용하여 ManyToMany 관계를 업데이트
            // 명시적으로! teams 배열에 team을 추가하고, 변경된 tournament 엔티티를 저장
            try {
                if (!tournament.teams.some((t) => t.id === team.id)) {
                    tournament.teams.push(team); // 메모리 상의 변경
                    await manager.save(tournament); // 변경 사항을 데이터베이스에 반영
                }
                return '신청이 완료되었습니다.';
            } catch (error) {
                return '신청에 실패했습니다.';
            }
        });
    }

    async cancelTournament(tournamentId: number, teamId: number) {
        // 토너먼트 정보 가져오기
        return await this.entityManager.transaction(async (manager) => {
            const tournament = await manager
                .createQueryBuilder(TournamentModel, 'tournament')
                .setLock('pessimistic_write')
                .leftJoinAndSelect('tournament.teams', 'teams')
                .where('tournament.id = :id', { id: tournamentId })
                .getOne();
            if (!tournament) {
                await this.loggingService.warn(
                    `존재하지 않는 토너먼트 아이디 ${tournamentId}에 취소`,
                );
                return '토너먼트가 존재하지 않습니다.';
            }

            // 신청 마감일 확인
            if (tournament.registerDeadline < new Date()) {
                return '신청 마감일이 지났습니다.';
            }

            // 팀이 신청했는지 확인
            if (!tournament.teams.find((team) => team.id === teamId)) {
                return '신청하지 않은 팀입니다.';
            }

            // 취소하기

            tournament.teams = tournament.teams.filter((team) => team.id !== teamId);
            tournament.isFinished = false;
            await manager.save(tournament);
            return '취소가 완료되었습니다.';
        });
    }

    async updateTournament(tournamentId: number, updateTournamentDto: UpdateTournamentDto) {
        // 토너먼트 정보 가져오기
        return await this.entityManager.transaction(async (manager) => {
            const tournament = await manager
                .createQueryBuilder(TournamentModel, 'tournament')
                .setLock('pessimistic_write')
                .leftJoinAndSelect('tournament.teams', 'teams')
                .where('tournament.id = :id', { id: tournamentId })
                .getOne();

            if (!tournament) {
                await this.loggingService.warn(
                    `존재하지 않는 토너먼트 아이디 ${tournamentId}에 수정`,
                );
                return '토너먼트가 존재하지 않습니다.';
            }

            // 주소를 어떻게 변경할 수 있을까?
            delete updateTournamentDto.address;
            // 수정하기

            await manager.update(TournamentModel, { id: tournamentId }, updateTournamentDto);

            return '수정이 완료되었습니다.';
        });
    }

    // 인원 미달 && 참가 데드라인 끝난 토너먼트 종료 처리
    @Cron(CronExpression.EVERY_HOUR)
    async closeFinishedTournaments() {
        const currentDate = new Date();
        const tournaments = await this.tournamentRepository.find({
            where: {
                registerDeadline: LessThan(currentDate),
                isFinished: false,
            },
            relations: ['teams'],
        });
        tournaments.forEach(async (tournament) => {
            if (tournament.teams.length < tournament.teamLimit) {
                tournament.isFinished = true;
                tournament.isCancelled = true;
                await this.tournamentRepository.save(tournament);
            }
        });
    }
}
