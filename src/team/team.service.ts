import { BadRequestException, Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AwsService } from 'src/aws/aws.service';
import { LocationService } from 'src/location/location.service';
import { MemberService } from 'src/member/member.service';
import { Repository } from 'typeorm';
import { CreateTeamDto } from './dtos/create-team.dto';
import { TeamModel } from './entities/team.entity';
import { DUPLICATE_TEAM_NAME, EXIST_CREATOR } from './validation-message/team-exception.message';
import { UpdateTeamDto } from './dtos/update-team.dto';

@Injectable()
export class TeamService {
    constructor(
        @InjectRepository(TeamModel)
        private readonly teamRepository: Repository<TeamModel>,
        private readonly awsService: AwsService,
        private readonly locationService: LocationService,
        @Inject(forwardRef(() => MemberService))
        private readonly memberService: MemberService,
    ) {}

    /**
     * 팀 생성하기
     * @param createTeamDto
     * @param userId
     * @param file
     * @returns
     */
    //@Transactional()
    async createTeam(createTeamDto: CreateTeamDto, userId: number, file: Express.Multer.File) {
        const existMember = await this.memberService.existMember(userId);
        if (existMember) {
            throw new BadRequestException(EXIST_CREATOR);
        }

        const existTeam = await this.teamRepository.exists({
            where: {
                name: createTeamDto.name,
            },
        });
        if (existTeam) {
            throw new BadRequestException(DUPLICATE_TEAM_NAME);
        }

        const extractLocation = this.locationService.extractAddress(createTeamDto.address);

        let findLocation = await this.locationService.findOneLocation(extractLocation);
        if (!findLocation) {
            findLocation = await this.locationService.registerLocation(
                createTeamDto.address,
                extractLocation,
            );
        }

        try {
            const imageUrl = await this.awsService.uploadFile(file);

            const result = this.teamRepository.create({
                ...createTeamDto,
                logoUrl: imageUrl,
                location: {
                    id: findLocation.id,
                },
                creator: { id: userId },
            });

            const savedTeam = await this.teamRepository.save(result);
            await this.memberService.registerCreaterMember(savedTeam.id, userId);

            return savedTeam;
        } catch (err) {
            console.log(err);
        }
    }

    /**
     * 팀 상세조회
     * @param teamId
     * @returns
     */
    getTeamDetail(teamId: number) {
        return this.teamRepository.findOne({
            where: {
                id: teamId,
            },
            relations: {
                creator: true,
            },
            select: {
                creator: {
                    id: true,
                    email: true,
                    name: true,
                },
            },
        });
    }

    /**
     * 팀 목록조회
     */
    getTeam() {
        return this.teamRepository.find({});
    }

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
                dto['logoUrl'] = await this.awsService.uploadFile(file);
            }

            await this.teamRepository.update(
                { id: teamId },
                {
                    ...dto,
                },
            );
        } catch (err) {}
        return console.log('업데이트 성공');
    }
}
