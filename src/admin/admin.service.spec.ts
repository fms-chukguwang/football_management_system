import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { CommonService } from 'src/common/common.service';
import { Repository } from 'typeorm';
import { TeamModel } from 'src/team/entities/team.entity';
import { User } from 'src/user/entities/user.entity';
import { PaginateTeamDto } from './dto/paginate-team.dto';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('AdminService', () => {
    let service: AdminService;
    let userRepository: Repository<User>;
    let commonService: CommonService;
    let teamRepository: Repository<TeamModel>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AdminService,
                {
                    provide: getRepositoryToken(User),
                    useValue: userRepository,
                },
                {
                    provide: getRepositoryToken(TeamModel),
                    useValue: teamRepository,
                },
                {
                    provide: CommonService,
                    useValue: {
                        paginate: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<AdminService>(AdminService);
        commonService = module.get<CommonService>(CommonService);
        userRepository = module.get(getRepositoryToken(User));
        teamRepository = module.get(getRepositoryToken(TeamModel));
    });

    it('getAllTeams 테스트', async () => {
        const dto = new PaginateTeamDto();
        commonService.paginate = jest.fn().mockResolvedValue('전체 팀 데이터 페이지네이션');
        const result = await service.getAllTeams(dto);
        expect(result).toBe('전체 팀 데이터 페이지네이션');
    });

    it('paginateUser 테스트', async () => {
        const dto = new PaginateTeamDto();
        commonService.paginate = jest.fn().mockResolvedValue('유저 데이터 페이지네이션');
        const result = await service.paginateUser(dto);
        expect(result).toBe('유저 데이터 페이지네이션');
    });

    it('paginateTeam 테스트', async () => {
        const dto = new PaginateTeamDto();
        commonService.paginate = jest.fn().mockResolvedValue('팀 데이터 페이지네이션');
        const result = await service.paginateTeam(dto);
        expect(result).toBe('팀 데이터 페이지네이션');
    });
});
