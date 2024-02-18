import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { TeamService } from 'src/team/team.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { IsAdminGuard } from './guards/isAdmin.guard';
import { PaginateTeamDto } from './dto/paginate-team.dto';
import { UserService } from 'src/user/user.service';
import exp from 'constants';

describe('AdminController', () => {
    let controller: AdminController;
    let userService: UserService;
    let teamService: TeamService;
    let adminService: AdminService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AdminController],
            providers: [
                AdminService,
                {
                    provide: TeamService,
                    useValue: {
                        deleteTeam: jest.fn(),
                    },
                },
                {
                    provide: UserService,
                    useValue: {
                        deleteId: jest.fn(),
                    },
                },
                {
                    provide: AdminService,
                    useValue: {
                        paginateTeam: jest.fn(),
                        paginateUser: jest.fn(),
                    },
                },
            ],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({ canActivate: jest.fn(() => true) })
            .overrideGuard(IsAdminGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<AdminController>(AdminController);
        userService = module.get<UserService>(UserService);
        teamService = module.get<TeamService>(TeamService);
        adminService = module.get<AdminService>(AdminService);
    });

    it('getAllTeams 테스트', async () => {
        const dto = new PaginateTeamDto();
        adminService.paginateTeam = jest.fn().mockResolvedValue('전체 팀 데이터 페이지네이션');
        const result = await controller.getAllTeams(dto);
        expect(result).toBe('전체 팀 데이터 페이지네이션');
        expect(adminService.paginateTeam).toHaveBeenCalledWith(dto);
    });

    it('getAllUsers 테스트', async () => {
        const dto = new PaginateTeamDto();
        adminService.paginateUser = jest.fn().mockResolvedValue('전체 유저 데이터 페이지네이션');
        const result = await controller.getAllUsers(dto);
        expect(result).toBe('전체 유저 데이터 페이지네이션');
        expect(adminService.paginateUser).toHaveBeenCalledWith(dto);
    });

    it('deleteUserById 테스트 _ dataType = users ', async () => {
        const dataType = 'users';
        const id = 1;
        userService.deleteId = jest.fn().mockResolvedValue('유저 삭제 완료');
        const result = await controller.deleteUserById(dataType, id);
        expect(result).toBe('유저 삭제 완료');
        expect(userService.deleteId).toHaveBeenCalledWith(id);
    });

    it('deleteUserById 테스트 _ dataType = teams ', async () => {
        const dataType = 'teams';
        const id = 1;
        teamService.deleteTeam = jest.fn().mockResolvedValue('팀 삭제 완료');
        const result = await controller.deleteUserById(dataType, id);
        expect(result).toBe('팀 삭제 완료');
        expect(teamService.deleteTeam).toHaveBeenCalledWith(id);
    });
});
