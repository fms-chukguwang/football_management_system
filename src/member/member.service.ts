import {
    BadRequestException,
    Inject,
    Injectable,
    NotFoundException,
    forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Member } from './entities/member.entity';
import { Repository } from 'typeorm';
import { UpdateMemberInfoDto } from './dtos/update-member-info-dto';
import { UserService } from 'src/user/user.service';
import { TeamService } from 'src/team/team.service';
import { EmailService } from 'src/email/email.service';
import { SendJoiningEmailDto } from './dtos/send-joining-email.dto';

@Injectable()
export class MemberService {
    constructor(
        @InjectRepository(Member)
        private readonly memberRepository: Repository<Member>,
        private readonly userService: UserService,
        @Inject(forwardRef(() => TeamService))
        private readonly teamService: TeamService,
        private readonly eamilService: EmailService,
    ) {}

    /**
     * 멤버 팀에 추가하기
     * @param userId
     * @param teamId
     * @returns
     */
    async registerMember(teamId: number, userId: number): Promise<Member> {
        const user = await this.userService.findOneById(userId);
        const existMember = await this.findMemberForUserId(user.id);

        if (existMember) {
            throw new BadRequestException('해당 인원은 이미 팀에 참가하고 있습니다.');
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
    async findMember(memberId: number, teamId: number): Promise<Member | null> {
        return await this.memberRepository.findOne({
            where: {
                id: memberId,
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
     * 유저Id로 멤버찾기
     * @param userId
     * @param teamId
     * @returns
     */
    async findMemberForUserId(userId: number, teamId?: number): Promise<Member | null> {
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
    async existMember(memberId: number) {
        return await this.memberRepository.exists({
            where: {
                id: memberId,
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
    async deleteMember(teamId: number, userId: number) {
        const findMember = await this.findMember(userId, teamId);

        if (!findMember) {
            throw new BadRequestException('존재하지 않은 팀원입니다.');
        }
        if (findMember.team.id !== teamId) {
            throw new BadRequestException('teamId가 일치하지 않습니다.');
        }

        await this.memberRepository.softDelete({
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
    async updateIsStaff(teamId: number, memberId: number, dto: UpdateMemberInfoDto) {
        const findMember = await this.findMember(memberId, teamId);
        console.log(memberId, teamId);
        console.log(findMember);
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

    /**
     * 입단일 수정(스태프용)
     * @param memberId
     * @param teamId
     * @param dto
     * @returns
     */
    async updateStaffJoinDate(memberId: number, teamId: number, dto: UpdateMemberInfoDto) {
        const findMember = await this.findMember(memberId, teamId);

        if (!findMember) {
            throw new BadRequestException('존재하지 않은 팀원입니다.');
        }

        const updatedMember = await this.memberRepository.update(
            { id: memberId },
            { joinDate: dto.joinDate },
        );

        return updatedMember;
    }

    /**
     * 자기 입단일 수정하기
     * @param memberId
     * @param teamId
     * @param dto
     * @returns
     */
    async updateMemberJoinDate(memberId: number, teamId: number, dto: UpdateMemberInfoDto) {
        const member = await this.findMemberForUserId(memberId, teamId);

        if (!member) {
            throw new BadRequestException('해당 팀에 해당 멤버가 존재하지 않습니다.');
        }

        const updatedMember = await this.memberRepository.update(
            { id: member.id },
            { joinDate: dto.joinDate },
        );

        return updatedMember;
    }

    async sendJoiningEmail(userId: number, teamId: number) {
        const findTeam = await this.teamService.getTeamDetail(teamId);

        if (!findTeam) {
            throw new NotFoundException('요청하신 팀이 존재하지 않습니다.');
        }

        const reqUser = await this.userService.findOneById(userId);
        /**
         * 요청할때 정보
         * 요청자의 아이디 , email , 이름
         */
        const reqeustEmail: SendJoiningEmailDto = {
            id: reqUser.id,
            email: reqUser.email,
            name: reqUser.name,
        };

        //await this.eamilService.sendTeamJoinEmail(reqeustEmail, findTeam);
        await this.eamilService.sendTeamJoinEmail(reqeustEmail, findTeam);
    }
}
