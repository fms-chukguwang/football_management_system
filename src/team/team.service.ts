import {
    BadRequestException,
    Inject,
    Injectable,
    forwardRef,
    NotFoundException,
    InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AwsService } from '../aws/aws.service';
import { LocationService } from '../location/location.service';
import { MemberService } from '../member/member.service';
import { DataSource, FindManyOptions, Like, Repository } from 'typeorm';
import { CreateTeamDto } from './dtos/create-team.dto';
import { TeamModel } from './entities/team.entity';
import {
    DUPLICATE_TEAM_NAME,
    EMPTY_USER,
    EXIST_CREATOR,
} from './validation-message/team-exception.message';
import { UpdateTeamDto } from './dtos/update-team.dto';
import { PaginateTeamDto } from './dtos/paginate-team-dto';
import { CommonService } from '../common/common.service';
import { RedisService } from 'src/redis/redis.service';
import { ChatsService } from 'src/chats/chats.service';
import { CreateChatDto } from 'src/chats/dto/create-chat.dto';

@Injectable()
export class TeamService {
    constructor(
        @InjectRepository(TeamModel)
        private readonly teamRepository: Repository<TeamModel>,
        private readonly awsService: AwsService,
        private readonly locationService: LocationService,
        @Inject(forwardRef(() => MemberService))
        private readonly memberService: MemberService,
        private readonly dataSource: DataSource,
        private readonly commonService: CommonService,
        private readonly chatService: ChatsService,
        private readonly redisService: RedisService,
    ) {}

    async findOneById(id: number) {
        const team = await this.teamRepository.findOne({
            where: {
                id,
            },
            relations: [
                'location',
                'creator',
                'members',
                'homeMatch',
                'awayMatch',
                'matchFormation',
            ],
        });

        if (!team) {
            throw new NotFoundException('팀을 찾을 수 없습니다.');
        }

        return team;
    }

    async paginateMyProfile(dto: PaginateTeamDto) {
        return await this.commonService.paginate(dto, this.teamRepository, {}, 'team');
    }

    /**
     * 팀 생성하기
     * @param createTeamDto
     * @param userId
     * @param file
     * @returns
     */
    //@Transactional()
    async createTeam(createTeamDto: CreateTeamDto, userId: number, file: Express.Multer.File) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();

        const existTeam = await this.teamRepository.findOne({
            where: {
                creator: {
                    id: userId,
                },
            },
        });
        if (existTeam) {
            throw new BadRequestException(EXIST_CREATOR);
        }

        const existTeamName = await this.teamRepository.exists({
            where: {
                name: createTeamDto.name,
            },
        });
        if (existTeamName) {
            throw new BadRequestException(DUPLICATE_TEAM_NAME);
        }

        try {
            await queryRunner.startTransaction();

            const extractLocation = this.locationService.extractAddress(createTeamDto.address);

            let findLocation = await this.locationService.findOneLocation(extractLocation);
            if (!findLocation) {
                findLocation = await this.locationService.registerLocation(
                    createTeamDto.address,
                    extractLocation,
                );
            }

            const imageUUID = await this.awsService.uploadFile(file);

            // 채팅방 생성
            const createChatDto: CreateChatDto = { userIds: [userId] };
            const chat = await this.chatService.createChat(createChatDto);

            const result = this.teamRepository.create({
                ...createTeamDto,
                imageUUID: imageUUID,
                location: {
                    id: findLocation.id,
                },
                creator: { id: userId },
                chat,
            });

            const savedTeam = await this.teamRepository.save(result);
            await this.memberService.registerCreaterMember(savedTeam.id, userId);

            await queryRunner.commitTransaction();

            return savedTeam;
        } catch (err) {
            console.log(err);
            await queryRunner.rollbackTransaction();
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * 팀 상세조회
     * @param teamId
     * @returns
     */
    async getTeamDetail(teamId: number) {
        let redisResult = await this.redisService.getTeamDetail(teamId);

        if (!redisResult) {
            console.log('redis 저장 시작');
            const findOneTeam = await this.teamRepository.findOne({
                where: {
                    id: teamId,
                },
                relations: {
                    creator: true,
                    location: true,
                },
                select: {
                    creator: {
                        id: true,
                        email: true,
                        name: true,
                    },
                },
            });

            await this.redisService.setTeamDetail(JSON.stringify(findOneTeam), teamId);

            redisResult = await this.redisService.getTeamDetail(teamId);
        }

        return JSON.parse(redisResult);
    }

    /**
     * 팀 전체조회
     * @returns
     */

    async getTeams() {
        const teams = await this.teamRepository.find();
        const teamWithCounts = await Promise.all(
            teams.map(async (team) => {
                const [data, count] = await this.memberService.getMemberCountByTeamId(team.id);
                return {
                    team,
                    totalMember: count,
                };
            }),
        );

        return teamWithCounts;
    }

    //호영님 코드 수정중

    async getTeam(dto: PaginateTeamDto, name?: string) {
        const options: FindManyOptions<TeamModel> = {};
        if (name) {
            options.where = { name: Like(`%${name}%`) };
        }

        const data = await this.teamRepository.find(options);

        const result = await this.commonService.paginate(dto, this.teamRepository, options, 'team');

        if ('total' in result) {
            const { data, total } = result;
            const teamWithCounts = await Promise.all(
                data.map(async (team) => {
                    const [data, count] = await this.memberService.getMemberCountByTeamId(team.id);
                    return {
                        team,
                        totalMember: count,
                    };
                }),
            );
            return { data: teamWithCounts, total };
        }
    }

    async getTeamByGender(userId, dto: PaginateTeamDto, name?: string) {
        const options: FindManyOptions<TeamModel> = {};
        if (name) {
            options.where = { name: Like(`%${name}%`) };
        }

        const data = await this.teamRepository.find(options);

        const result = await this.commonService.paginate(dto, this.teamRepository, options, 'team');

        if ('total' in result) {
            const { data, total } = result;
            const teamWithCounts = await Promise.all(
                data.map(async (team) => {
                    const [data, count] = await this.memberService.getMemberCountByTeamId(team.id);
                    return {
                        team,
                        totalMember: count,
                    };
                }),
            );
            return { data: teamWithCounts, total };
        }
    }

    /**
     * 팀 목록조회
     * @returns
     */

    async getTeam2(dto: PaginateTeamDto, name?: string) {
        const options: FindManyOptions<TeamModel> = {};
        if (name) {
            options.where = { name: Like(`%${name}%`) };
        }

        const data = await this.teamRepository.find(options);

        return await this.commonService.paginate(dto, this.teamRepository, options, 'team');

        // return await this.commonService.paginate(dto, this.teamRepository, {}, 'team');
    }

    // async getTeam2(dto: PaginateTeamDto) {
    //     const result = await this.commonService.paginate(dto, this.teamRepository, {}, 'team');
    //     if ('total' in result) {
    //         const { data, total } = result;
    //         const teamWithCounts = await Promise.all(
    //             data.map(async (team) => {
    //                 const [data, count] = await this.memberService.getMemberCountByTeamId(team.id);
    //                 return {
    //                     team,
    //                     totalMember: count,
    //                 };
    //             }),
    //         );
    //         return { data: teamWithCounts, total };
    //     }
    // }

    /**
     * 팀 수정하기
     * @param teamId
     * @param dto
     * @param file
     * @returns
     */
    async updateTeam(teamId: number, dto: UpdateTeamDto, file: Express.Multer.File) {
        try {
            if (file) {
                console.log('저장전 : ', dto['imageUrl']);
                dto['imageUUID'] = await this.awsService.uploadFile(file);
            }

            await this.teamRepository.update(
                { id: teamId },
                {
                    ...dto,
                },
            );

            await this.redisService.delTeamDetail(teamId);
        } catch (err) {
            console.log(err);
            throw new InternalServerErrorException('업데이트중 예기치 못한 오류가 발생하였습니다.');
        }
    }
}
