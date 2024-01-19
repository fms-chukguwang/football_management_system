import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateTeamDto } from './dtos/create-team.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { TeamModel } from './entities/team.entity';
import { Repository, Transaction } from 'typeorm';
import {
    DUPLICATE_TEAM_NAME,
    EXIST_CREATOR,
} from './validation-message/team-exception.message';
import { AwsService } from 'src/aws/aws.service';
import { LocationService } from 'src/location/location.service';
import { MemberService } from 'src/member/member.service';
import {
    Transactional,
    runOnTransactionCommit,
    runOnTransactionRollback,
} from 'typeorm-transactional-cls-hooked';

@Injectable()
export class TeamService {
    constructor(
        @InjectRepository(TeamModel)
        private readonly teamRepository: Repository<TeamModel>,
        private readonly awsService: AwsService,
        private readonly locationService: LocationService,
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
    async createTeam(
        createTeamDto: CreateTeamDto,
        userId: number,
        file: Express.Multer.File,
    ) {
        const existCreator = await this.teamRepository.exists({
            where: {
                creator: {
                    id: userId,
                },
            },
        });
        if (existCreator) {
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

        const extractLocation = this.locationService.extractAddress(
            createTeamDto.address,
        );

        let findLocation =
            await this.locationService.findOneLocation(extractLocation);
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
            await this.memberService.registerCreaterMember(
                savedTeam.id,
                userId,
            );

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
                    name: true,
                },
            },
        });
    }
}