import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UpdateMyInfoDto } from '../auth/dtos/update-my-info.dto';
import { HttpStatus } from '@nestjs/common';
import { User } from './entities/user.entity';

describe('UserController', () => {
    let controller: UserController;
    let userService: UserService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [UserController],
            providers: [UserService],
        }).compile();

        controller = module.get<UserController>(UserController);
        userService = module.get<UserService>(UserService);
    });

    describe('findMe', () => {
        it('should return user info', async () => {
            // Mock user data
            const user = new User();
            user.id = 1;
            user.name = 'Test User';
            user.email = 'test@example.com';
            // Mock service method
            jest.spyOn(userService, 'findOneById').mockResolvedValue(user);
            // Mock request object
            const req = { user: { id: 1 } };
            // Call controller method
            const result = await controller.findMe(req);
            // Assert the result
            expect(result).toEqual({
                statusCode: HttpStatus.OK,
                message: '내 정보 조회에 성공했습니다.',
                data: user,
            });
        });
    });

    describe('updateMyInfo', () => {
        it('should update user info', async () => {
            // Mock user data
            const updateInfoDto: UpdateMyInfoDto = { name: 'Updated Name', email: 'updated@example.com' };
            // Mock updated user data
            const updatedUser = new User();
            updatedUser.id = 1;
            updatedUser.name = 'Updated Name';
            updatedUser.email = 'updated@example.com';
            // Mock service method
            jest.spyOn(userService, 'updateMyInfo').mockResolvedValue(updatedUser);
            // Mock request object
            const req = { user: { id: 1 } };
            // Call controller method
            const result = await controller.updateMyInfo(req, updateInfoDto);
            // Assert the result
            expect(result).toEqual({
                statusCode: HttpStatus.OK,
                message: '내 정보 수정에 성공했습니다.',
                data: updatedUser,
            });
        });
    });

    describe('deleteMe', () => {
        it('should delete user', async () => {
            // Mock user data
            const user = new User();
            user.id = 1;
            user.name = 'Test User';
            user.email = 'test@example.com';
            // Mock service method
            jest.spyOn(userService, 'deleteId').mockResolvedValue(undefined); // 수정된 부분
            // Mock request object
            const req = { user: { id: 1 } };
            // Call controller method
            const result = await controller.deleteMe(req);
            // Assert the result
            expect(result).toEqual({
                statusCode: HttpStatus.OK,
                message: '회원탈퇴에 성공했습니다.',
                data: user,
            });
        });
    });
});
