import {
    BadRequestException,
    Inject,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
    UnauthorizedException,
    forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Member } from './entities/member.entity';
import { DataSource, FindManyOptions, Like, Repository } from 'typeorm';
import { UpdateMemberInfoDto } from './dtos/update-member-info-dto';
import { UserService } from '../user/user.service';
import { TeamService } from '../team/team.service';
import { EmailService } from '../email/email.service';
import { SendJoiningEmailDto } from './dtos/send-joining-email.dto';
import { RedisService } from '../redis/redis.service';
import { UpdateProfileInfoDto } from '../profile/dtos/update-profile-info-dto';
import { ProfileService } from '../profile/profile.service';
import { TeamModel } from '../team/entities/team.entity';
import { consoleSandbox } from '@sentry/utils';
import { ChatsService } from '../chats/chats.service';
import { PaginateTeamDto } from '../admin/dto/paginate-team.dto';
import { CommonService } from '../common/common.service';
import { ResponseMemberDto } from './dtos/response-member.dto';
import { User } from 'src/user/entities/user.entity';
import { MemberGateway } from './member.gateway';
import { ChatsGateway } from 'src/chats/chats.gateway';
import { Profile } from 'src/profile/entities/profile.entity';

@Injectable()
export class MemberService {
    constructor(
        @InjectRepository(Member)
        private readonly memberRepository: Repository<Member>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly userService: UserService,
        @Inject(forwardRef(() => TeamService))
        private readonly teamService: TeamService,
        private readonly eamilService: EmailService,
        private readonly redisService: RedisService,
        private readonly chatsService: ChatsService,
        private readonly commonService: CommonService,
        @InjectRepository(TeamModel)
        private readonly teamRepository: Repository<TeamModel>,
        @InjectRepository(Profile)
        private readonly profileRepository: Repository<Profile>,
        private readonly profileService: ProfileService,
        private readonly memberGateway: MemberGateway,
        private readonly chatsGateway: ChatsGateway,
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
        const Player = await this.memberRepository.findOne({
            select: {
                team: {
                    id: true,
                },
                user: {
                    id: true,
                },
            },
            where: {
                id,
            },
            relations: {
                team: true,
                user: true,
            },
        });

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
    async registerMember(teamId: number, userId: number): Promise<Member> {
        const user = await this.userService.findOneById(userId);
        const existMember = await this.findMemberForUserId(user.id);
        const team = await this.teamRepository.findOne({
            where: { id: teamId },
            relations: ['chat'],
        });

        if (existMember) {
            throw new BadRequestException('해당 인원은 이미 팀에 참가하고 있습니다.');
        }
        console.log('여기 통과', user);
        if (!user.profile) {
            throw new BadRequestException('프로필이 존재하지 않은 유저는 팀에 등록할수 없습니다.');
        }
        console.log('프로필 ');
        if (!team.isMixedGender) {
            if (user.profile.gender !== team.gender) {
                //팀이 혼성이 아닌데 성별이 다를때
                throw new BadRequestException('팀의 성별과 일치하지 않습니다.');
            }
        }
        console.log('혼성 통과 ');

        const registerMember = await this.memberRepository.save({
            user: {
                id: userId,
            },
            team: {
                id: teamId,
            },
        });
        console.log('저장 통과');

        const chatId = team.chat.id;
        await this.chatsService.inviteChat(chatId, userId);
        this.chatsGateway.enterTeam(teamId, userId);

        return registerMember;
    }

    //많은 멤버 한번에 추가하기
    async registerManyMembers(teamId: number, userIds: number[]): Promise<Member[]> {
        const users = await Promise.all(
            userIds.map((userId) => this.userService.findOneById(userId)),
        );
        const existingMembers = await Promise.all(
            users.map((user) => this.findMemberForUserId(user.id)),
        );

        const registerMembers = await Promise.all(
            users.map((user) =>
                this.memberRepository.save({
                    user: { id: user.id },
                    team: { id: teamId },
                }),
            ),
        );

        return registerMembers;
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
                user: true,
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
     * 스태프 여부 업데이트
     * @param teamId
     * @param currentLoginUserId
     * @param dto
     */
    async updateIsStaff(teamId: number, memberId: number, dto: UpdateMemberInfoDto) {
        const findMember = await this.findMember(memberId, teamId);

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
    async registerCreatorMember(teamId: number, userId: number) {
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
    async updateUserAdminStatus(userId: number, isAdmin: boolean): Promise<boolean> {
        try {
            const user = await this.userRepository.findOneBy({ id: userId });
            if (!user) {
                return false; // 사용자를 찾을 수 없음
            }

            user.isAdmin = isAdmin;
            await this.userRepository.save(user);
            return true; // 성공적으로 업데이트됨
        } catch (error) {
            console.error(error);
            return false; // 업데이트 실패
        }
    }

    /**
     * 구단에게 입단 요청하기(구단주에게 이메일을 보낸다)
     * @param userId
     * @param teamId
     * @returns
     */
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

        const sendResult = await this.eamilService.sendTeamJoinEmail(reqeustEmail, findTeam);

        return sendResult;
    }

    /**
     * 구단 초대 이메일 보내기
     * @param userId
     * @param teamId
     * @returns
     */
    async sendInvitingEmail(userId: number, teamId: number, profileId: number) {
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

        const sendResult = await this.eamilService.sendInviteEmail(reqeustEmail, findTeam);

        // 초대된 프로필의 invited 필드와 팀 아이디를 업데이트
        const profile = await this.profileRepository.findOne({ where: { id: profileId } });
        if (!profile) {
            throw new NotFoundException('프로필을 찾을 수 없습니다.');
        }
        profile.invited = true;
        profile.teamId = teamId; // 팀 아이디 저장
        await this.profileRepository.save(profile);

        return sendResult;
    }

    /**
     * 구단 입단 신청 거절 이메일 전송
     * @param teamId
     * @param userId
     * @returns
     */
    async rejectJoiningEamil(teamId: number, userId: number) {
        const findTeam = await this.teamService.getTeamDetail(teamId);
        const findUser = await this.userService.findOneById(userId);

        const rejectResult = this.eamilService.sendTeamRejectEmail(findTeam.name, findUser);

        return rejectResult;
    }

    /**
     * 수락전 토큰이 만료되었는지 검증
     * @param token
     */
    async verifyEmailToken(token: string) {
        const findToken = await this.redisService.getTeamJoinMailToken(token);

        if (!findToken) {
            throw new UnauthorizedException('토큰이 만료되었습니다.');
        }

        console.log(`찾기`, findToken);
    }

    /**
     * 처리가 완료되었을때 토큰값을 삭제한다.
     * @param token
     */
    async deleteEmailToken(token: string) {
        await this.redisService.deleteTeamJoinMailToken(token);
    }

    async getTeamMembers(teamId: number, dto: PaginateTeamDto, name?: string) {
        try {
            const options: FindManyOptions<Member> = {
                select: {
                    id: true,
                    isStaff: true,
                    team: {
                        id: true,
                    },
                    user: {
                        id: true,
                        name: true,
                        email: true,
                        profile: {
                            preferredPosition: true,
                            imageUrl: true,
                            age: true,
                        },
                    },
                    matchformation: {
                        position: true,
                    },
                    createdAt: true, // 추가된 부분
                },
                where: {
                    team: {
                        id: teamId,
                    },
                },
                relations: {
                    team: true,
                    user: { profile: true },
                    matchformation: true,
                },
            };

            if (name) {
                options.where = {
                    ...options.where,
                    user: {
                        name: Like(`%${name}%`),
                    },
                };
            }

            const findMembers = await this.memberRepository.find(options);

            console.log('findMembers:', findMembers);

            return await this.commonService.paginate(dto, this.memberRepository, options, 'member');
        } catch (error) {
            console.error('Error fetching team members:', error);
            throw new Error('Failed to fetch team members');
        }
    }

    async getMemberCountByTeamId(teamId: number) {
        const findMembers = await this.memberRepository.findAndCount({
            where: {
                team: {
                    id: teamId,
                },
            },
            relations: ['team', 'user', 'user.profile'],
        });

        return findMembers;
    }

    /**
     * 멤버 상세조회
     * @param temaId
     * @param memberId
     * @returns
     */
    async getMember(temaId: number, memberId: number): Promise<ResponseMemberDto> {
        const findMember = await this.memberRepository.findOne({
            select: {
                team: {
                    id: true,
                    name: true,
                },
                user: {
                    id: true,
                    name: true,
                },
            },
            where: {
                id: memberId,
                team: {
                    id: temaId,
                },
            },
            relations: {
                team: true,
                user: true,
            },
        });
        if (!findMember) {
            throw new NotFoundException('회원을 찾을수 없습니다.');
        }

        const findProfile = await this.profileService.getProfileByUserId(findMember.user.id);
        if (!findProfile) {
            throw new NotFoundException('프로필을 찾을수 없습니다.');
        }

        return {
            id: findMember.id,
            joinDate: findMember.joinDate,
            teamName: findMember.team.name,
            userName: findMember.user.name,
            weight: findProfile.weight,
            height: findProfile.height,
            preferredPosition: findProfile.preferredPosition,
            imageUUID: findProfile.imageUUID,
            gender: findProfile.gender,
            age: findProfile.age,
        };
    }

    async expulsionMember(teamId: number, memberId: number, userId: number) {
        /**
         * 1) 현재 들어온 팀id의 구단주가 userId인지 확인해야함
         * 2) 탈퇴시키려는 멤버가 해당 팀 member인지 확인해야함
         */
        const findTeam = await this.teamService.findOneById(teamId);
        if (findTeam.creator.id !== userId) {
            throw new UnauthorizedException('구단주만 해당 기능을 이용할수 있습니다.');
        }

        const findMember = await this.findMember(memberId, teamId);
        if (!findMember) {
            throw new NotFoundException('해당 멤버는 해당 팀에 존재하지 않습니다.');
        }

        try {
            await this.memberRepository.softDelete({ id: memberId });
            await this.eamilService.sendEmail(
                findMember.user.email,
                '팀에서 탈퇴처리 되었습니다',
                `
                ${new Date().toLocaleString()}부로 ${findTeam.name}에서 탈퇴처리 되었습니다.
            `,
            );
        } catch (err) {
            throw new InternalServerErrorException(err);
        }
    }
}
