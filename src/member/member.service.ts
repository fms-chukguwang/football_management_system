import {
    BadRequestException,
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { compare } from 'bcrypt';
import { Member } from './entities/member.entity';
import { Repository } from 'typeorm';
import { RegisterMemberInfoDto } from './dtos/register-member-info';
import { UpdateMemberInfoDto } from './dtos/update-member-info-dto';

@Injectable()
export class MemberService {
    constructor(
        @InjectRepository(Member)
        private readonly memberRepository: Repository<Member>,
    ) {}

    async findAllPlayers() {
        const Players = await this.memberRepository.find({
            relations: ['user', 'user.profile', 'team'], 
          });
        if (!Players) {
            throw new NotFoundException('선수를 찾을 수 없습니다.');
        }

        return Players;
    }

    async findOneById(id: number) {
        const Player = await this.memberRepository.findOneBy({ id });
        console.log('Player=', Player);

        if (!Player) {
            throw new NotFoundException('선수를 찾을 수 없습니다.');
        }

        return Player;
    }

    /**
     * 멤버 팀에 추가하기
     * @param userId
     * @param teamId
     * @returns
     */
    async registerMember(
        currentLoginUserId: number,
        teamId: number,
        userId: number,
    ): Promise<Member> {
        const findCurrentLoginMember = await this.findMember(
            currentLoginUserId,
            teamId,
        );
        if (!findCurrentLoginMember) {
            throw new UnauthorizedException(
                '해당 인원은 팀에 속해있지 않기때문에 팀원을 추가할수없습니다.',
            );
        }
        if (!findCurrentLoginMember.isStaff) {
            throw new UnauthorizedException(
                '스태프만 팀원을 추가할수 있습니다.',
            );
        }

        const existMember = await this.existMember(userId);
        if (existMember) {
            throw new BadRequestException(
                '해당 인원은 이미 팀에 참가하고 있습니다.',
            );
        }

        const registerMember = await this.memberRepository.save({
            user: {
                id: userId,
            },
            team: {
                id: teamId,
            },
        });

        return registerMember;
    }

    /**
     * 멤버 찾기
     * @param userId
     * @param teamId
     * @returns
     */
    async findMember(userId: number, teamId: number): Promise<Member | null> {
        return await this.memberRepository.findOne({
            where: {
                user: {
                    id: userId,
                },
                team: {
                    id: teamId,
                },
            },
            relations: {
                team: true,
            },
        });
    }

    /**
     * 회원 존재 여부
     * @param userId
     * @returns
     */
    async existMember(userId: number) {
        return await this.memberRepository.exists({
            where: {
                user: {
                    id: userId,
                },
            },
        });
    }

    /**
     * 팀원 추방하기
     * @param currentLoginUserId
     * @param teamId
     * @param userId
     * @returns
     */
    async deleteMember(
        currentLoginUserId: number,
        teamId: number,
        userId: number,
    ) {
        const findCurrentLoginMember = await this.findMember(
            currentLoginUserId,
            teamId,
        );
        if (!findCurrentLoginMember) {
            throw new UnauthorizedException(
                '해당 인원은 팀에 속해있지 않기때문에 팀원을 추가할수없습니다.',
            );
        }
        if (!findCurrentLoginMember.isStaff) {
            throw new UnauthorizedException(
                '스태프만 팀원을 삭제할수 있습니다.',
            );
        }

        const findMember = await this.findMember(userId, teamId);
        if (!findMember) {
            throw new BadRequestException('존재하지 않은 팀원입니다.');
        }
        if (findMember.team.id !== teamId) {
            throw new BadRequestException('teamId가 일치하지 않습니다.');
        }

        await this.memberRepository.delete({
            id: findMember.id,
        });

        return findMember;
    }

    /**
     * 스태프 여부 업데이트
     * @param teamId
     * @param currentLoginUserId
     * @param dto
     */
    async updateIsStaff(
        teamId: number,
        currentLoginUserId: number,
        dto: UpdateMemberInfoDto,
    ) {
        const findCurrentLoginMember = await this.findMember(
            currentLoginUserId,
            teamId,
        );
        if (!findCurrentLoginMember) {
            throw new UnauthorizedException(
                '해당 인원은 팀에 속해있지 않기때문에 팀원을 업데이트 할수가 없습니다.',
            );
        }
        if (!findCurrentLoginMember.isStaff) {
            throw new UnauthorizedException(
                '스태프만 팀원의 권한을 부여할수 있습니다.',
            );
        }

        const findMember = await this.findMember(dto.userId, teamId);
        if (!findMember) {
            throw new BadRequestException('해당 팀원이 존재하지 않습니다.');
        }

        const updatedMember = await this.memberRepository.update(
            {
                id: findMember.id,
            },
            {
                isStaff: dto.isStaff,
            },
        );

        return updatedMember;
    }

    /**
     * 팀생성시 생성자 멤버등록
     */
    async registerCreaterMember(teamId: number, userId: number) {
        await this.memberRepository.save({
            team: {
                id: teamId,
            },
            user: {
                id: userId,
            },
            isStaff: true,
        });
    }
}
