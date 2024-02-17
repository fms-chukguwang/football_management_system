import { Test, TestingModule } from '@nestjs/testing';
import { TournamentController } from './tournament.controller';
import { TournamentService } from './tournament.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { IsAdminGuard } from 'src/admin/guards/isAdmin.guard';
import { CreateTournamentDto } from './dtos/create-tournament.dto';
import { IsStaffGuard } from 'src/member/guard/is-staff.guard';
import { UpdateTournamentDto } from './dtos/update-tournament.dto';

const mockTournamentService = {
    createTournament: jest.fn().mockImplementation((dto) => {
        return Promise.resolve({ id: 1, name: dto.name });
    }),
    applyTournament: jest.fn().mockImplementation((tournamentId, teamId) => {
        return Promise.resolve('신청이 완료되었습니다.');
    }),
    cancelTournament: jest.fn().mockImplementation((tournamentId, teamId) => {
        return Promise.resolve('취소가 완료되었습니다.');
    }),
    updateTournament: jest.fn().mockImplementation((tournamentId, dto) => {
        return Promise.resolve('수정이 완료되었습니다.');
    }),
};

describe('TournamentController', () => {
    let controller: TournamentController;
    let service: TournamentService;
    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [TournamentController],
            providers: [
                {
                    provide: TournamentService,
                    useValue: mockTournamentService,
                },
            ],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({ canActivate: () => true })
            .overrideGuard(IsAdminGuard)
            .useValue({ canActivate: jest.fn(() => true) })
            .overrideGuard(IsStaffGuard)
            .useValue({ canActivate: jest.fn(() => true) })
            .compile();

        controller = module.get<TournamentController>(TournamentController);
        service = module.get<TournamentService>(TournamentService);
    });

    it('createTournament 테스트', async () => {
        const createTournamentDto = new CreateTournamentDto();

        await controller.createTournament(createTournamentDto);

        expect(service.createTournament).toHaveBeenCalledWith(createTournamentDto);
    });

    it('createTournament 반환값 테스트', async () => {
        const createTournamentDto = new CreateTournamentDto();

        const result = await controller.createTournament(createTournamentDto);

        expect(result).toEqual({ id: 1, name: createTournamentDto.name });
    });

    it('applyTournament 테스트', async () => {
        const tournamentId = 1;
        const teamId = 1;

        const result = await controller.applyTournament(tournamentId, teamId);

        expect(service.applyTournament).toHaveBeenCalledWith(tournamentId, teamId);

        expect(result).toEqual({
            message: '신청이 완료되었습니다.',
            statusCode: 201,
            success: true,
        });
    });

    it('cancelTournament 테스트', async () => {
        const tournamentId = 1;
        const teamId = 1;
        const result = await controller.cancelTournament(tournamentId, teamId);
        expect(service.cancelTournament).toHaveBeenCalledWith(tournamentId, teamId);
        expect(result).toEqual({
            message: '취소가 완료되었습니다.',
            statusCode: 200,
            success: true,
        });
    });

    it('updateTournament 테스트', async () => {
        const tournamentId = 1;
        const updateTournamentDto = new UpdateTournamentDto();

        const result = await controller.updateTournament(tournamentId, updateTournamentDto);

        expect(result).toEqual({
            message: '수정이 완료되었습니다.',
            statusCode: 200,
            success: true,
        });

        expect(service.updateTournament).toHaveBeenCalledWith(tournamentId, updateTournamentDto);
    });
});
