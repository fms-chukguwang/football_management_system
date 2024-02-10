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
import { DataSource, FindManyOptions, getManager, Like, Repository, Connection } from 'typeorm';
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
import { RedisService } from '../redis/redis.service';
import { ChatsService } from '../chats/chats.service';
import { CreateChatDto } from '../chats/dto/create-chat.dto';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

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
        private readonly connection: Connection,
    ) {}

    async findOneById(id: number) {
        const team = await this.teamRepository.findOne({
            where: {
                id,
            },
            relations: ['location', 'creator', 'members', 'homeMatch', 'awayMatch'],
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
    
        const extractLocation = this.locationService.extractAddress(createTeamDto.address);
    
        let findLocation = await this.locationService.findOneLocation(extractLocation);
    
        if (!findLocation) {
            findLocation = await this.locationService.registerLocation(createTeamDto.address, extractLocation);
        }
    
        const imageUUID = await this.awsService.uploadFile(file);
    
        // 채팅방 생성
        const createChatDto: CreateChatDto = { userIds: [userId] };
        const chat = await this.chatService.createChat(createChatDto);
    
        const team = await this.teamRepository.save({
            ...createTeamDto,
            imageUUID: imageUUID,
            location: {
                id: findLocation.id,
            },
            creator: { id: userId },
            chat,
        });
    
        // try {
        //     // 사용자의 isAdmin 상태를 업데이트
        //     const isAdminUpdated = await this.memberService.updateUserAdminStatus(userId, true);
        //     console.log("isAdminUpdated=",isAdminUpdated)
        //     if (!isAdminUpdated) {
        //         // 업데이트 실패 시 롤백 또는 적절한 오류 처리
        //         throw new InternalServerErrorException('사용자의 관리자 상태를 업데이트할 수 없습니다.');
        //     }

        //     return team;
        // } catch (err) {
        //     console.error(err);
        //     throw new InternalServerErrorException('팀 생성 중 오류가 발생했습니다.');
        // }
    }

    
    /**
     * 팀 상세조회
     * @param teamId
     * @returns
     */
    async getTeamDetail(teamId: number) {
        let redisResult = await this.redisService.getTeamDetail(teamId);

        if (!redisResult) {
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
        const teams = await this.teamRepository.find({
            relations: ['location'],
        });
    
        const teamWithCounts = await Promise.all(
            teams.map(async (team) => {
                const [data, count] = await this.memberService.getMemberCountByTeamId(team.id);
                return {
                    team: {
                        ...team,
                        location: team.location, 
                    },
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
    
        options.relations = ['location']; 
    
        const result = await this.commonService.paginate(dto, this.teamRepository, options, 'team');
    
        if ('total' in result) {
            const { data, total } = result;
            const teamWithCounts = await Promise.all(
                data.map(async (team) => {
                    const [data, count] = await this.memberService.getMemberCountByTeamId(team.id);
                    return {
                        team: {
                            ...team,
                            location: team.location,  
                        },
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
     async updateTeam(teamId: number, updateTeamDto: UpdateTeamDto, file: Express.Multer.File) {
        try {
            const { latitude, longitude, ...rest } = updateTeamDto;
    
            // Location 업데이트를 위한 수정
            const locationUpdate = {
                type: 'Point',
                coordinates: [longitude, latitude],
            };
    
            const updatedTeam = {
                ...rest,
                location: locationUpdate,
            } as QueryDeepPartialEntity<TeamModel>;
    
            if (file) {
                console.log('저장전 : ', updateTeamDto.imageUrl);
                updatedTeam.imageUUID = await this.awsService.uploadFile(file);
            }
    
            await this.teamRepository.update({ id: teamId }, updatedTeam);
    
            await this.redisService.delTeamDetail(teamId);
        } catch (err) {
            console.error(err);
            throw new InternalServerErrorException('팀 업데이트 중 예기치 못한 오류가 발생했습니다.');
        }
    }
    
    
    

    /**
     * 팀 삭제하기
     * @param teamId
     * @param dto
     * @returns
     */
    async deleteTeam(teamId: number) {
        const team = await this.teamRepository.findOneBy({ id: teamId });
        if (!team) {
            throw new NotFoundException(`User with ID ${team} not found`);
        }

        console.log('teamId : ', teamId);
        // Soft delete 처리
        await this.teamRepository.softDelete({
            id: teamId,
        });
    }
}
