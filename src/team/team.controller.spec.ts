import { Test, TestingModule } from '@nestjs/testing';
import { TeamController } from './team.controller';
import { TeamService } from './team.service';
import { MemberService } from '../member/member.service';
import { HttpStatus } from '@nestjs/common';
import { Gender } from 'src/enums/gender.enum';
import { PaginateTeamDto } from './dtos/paginate-team-dto';
import { UpdateTeamDto } from './dtos/update-team.dto';

const mockTeamService = {
    createTeam: jest.fn((dto, userId, file) => {
        return Promise.resolve({ id: 1, name: dto.name });
    }),
    getTeamDetail: jest.fn().mockImplementation((teamId) => {
        return Promise.resolve({ id: teamId, name: 'Test Team' });
    }),
    getTeam: jest.fn().mockImplementation((dto) => {
        return Promise.resolve([
            {
                id: 1,
                name: 'Test Team',
            },

            {
                id: 2,
                name: 'Test Team2',
            },
        ]);
    }),

    updateTeam: jest.fn().mockImplementation((dto, teamId, file) => {
        return Promise.resolve({ id: teamId, name: dto.name });
    }),
};

const mockMemberService = {
    getMemberCountByTeamId: jest.fn().mockImplementation((teamId) => {
        return Promise.resolve([
            [
                {
                    id: 1,
                    user: {
                        name: 'Test Name1',
                    },
                },

                {
                    id: 2,
                    user: {
                        name: 'Test Name2',
                    },
                },
            ],
            2,
        ]);
    }),
};

describe('TeamController', () => {
    let controller: TeamController;
    let service: TeamService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [TeamController],
            providers: [
                {
                    provide: TeamService,
                    useValue: mockTeamService,
                },
                {
                    provide: MemberService,
                    useValue: mockMemberService,
                },
            ],
        }).compile();

        controller = module.get<TeamController>(TeamController);
        service = module.get<TeamService>(TeamService);
    });

    it('성공', async () => {
        const mockCreateTeamDto = {
            name: 'Test Team',
            description: 'This is a test team',
            address: '테스트 주소',
            state: '테스트 주',
            district: '테스트',
            city: '테스트',
            latitude: 0,
            longitude: 0,
            gender: Gender.Male,
            isMixedGender: false,
        };
        const mockUserId = 1;
        const mockFile = {} as Express.Multer.File;

        const mockReq = {
            user: {
                id: mockUserId,
            },
        } as any;

        const result = await controller.createTeam(mockReq, mockCreateTeamDto, mockFile);

        expect(result).toEqual({ status: HttpStatus.OK, success: true, data: expect.any(Object) });
        expect(mockTeamService.createTeam).toHaveBeenCalledWith(
            mockCreateTeamDto,
            mockUserId,
            mockFile,
        );
    });

    it('팀 상세조회', async () => {
        const mockTeamId = 1;

        const result = await controller.getTeamDetail(mockTeamId);

        expect(result).toEqual({ team: expect.any(Object), totalMember: expect.any(Number) });
    });

    it('팀 목록 조회', async () => {
        const dto = new PaginateTeamDto();
        const result = await controller.getTeam(dto);
        expect(result).toEqual([
            {
                id: 1,
                name: 'Test Team',
            },

            {
                id: 2,
                name: 'Test Team2',
            },
        ]);
    });

    describe('팀 정보 수정', () => {
        it('성공', async () => {
            const mockUpdateTeamDto = new UpdateTeamDto();
            const mockTeamId = 1;
            const mockFile = {} as Express.Multer.File;

            const result = await controller.updateTeam(mockUpdateTeamDto, mockTeamId, mockFile);

            expect(result).toEqual({
                message: '업데이트가 성공하였습니다.',
                statusCode: HttpStatus.OK,
                success: true,
            });
        });

        it('실패', async () => {
            const mockUpdateTeamDto = new UpdateTeamDto();
            const mockTeamId = 1;
            const mockFile = {} as Express.Multer.File;
            jest.spyOn(mockTeamService, 'updateTeam').mockRejectedValue(new Error());

            const response = await controller.updateTeam(mockUpdateTeamDto, mockTeamId, mockFile);

            expect(response).toHaveProperty('statusCode', HttpStatus.INTERNAL_SERVER_ERROR);
            expect(response).toHaveProperty('success', false);
            expect(response).toHaveProperty(
                'message',
                expect.stringContaining('업데이트가 실패하였습니다. error'),
            );
        });
    });

    it('팀 멤버 조회', async () => {
        const teamId = 1;
        const expectedReturn = {
            data: [
                {
                    memberId: 1,
                    name: 'Test Name1',
                },

                {
                    memberId: 2,
                    name: 'Test Name2',
                },
            ],
            total: 2,
        };
        const result = await controller.getTeamMembers(teamId);
        expect(result).toEqual(expectedReturn);
    });
});
