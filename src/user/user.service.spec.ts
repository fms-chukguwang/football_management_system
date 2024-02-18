import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';

describe('UserService', () => {
    let service: UserService;
    let mockUserRepository;
  
    beforeEach(async () => {
      // Mock UserRepository 생성
      mockUserRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        findOneBy: jest.fn(),
        save: jest.fn(),
        softDelete: jest.fn(),
      };
  
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          UserService,
          {
            provide: getRepositoryToken(User),
            useValue: mockUserRepository,
          },
        ],
      }).compile();
  
      service = module.get<UserService>(UserService);
    });
  
    afterEach(() => {
      jest.clearAllMocks();
    });
  
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  
    describe('findAllUsers', () => {
      it('should return all users', async () => {
        const users = [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }];
        mockUserRepository.find.mockResolvedValue(users);
  
        const result = await service.findAllUsers();
  
        expect(result).toEqual(users);
      });
  
      it('should throw NotFoundException if no users found', async () => {
        mockUserRepository.find.mockResolvedValue(null);
  
        await expect(service.findAllUsers()).rejects.toThrowError(NotFoundException);
      });
    });
  
    describe('findOneById', () => {
      it('should return user by id', async () => {
        const user = { id: 1, name: 'John' };
        mockUserRepository.findOne.mockResolvedValue(user);
  
        const result = await service.findOneById(1);
  
        expect(result).toEqual(user);
      });
  
      it('should throw NotFoundException if user not found', async () => {
        mockUserRepository.findOne.mockResolvedValue(null);
  
        await expect(service.findOneById(1)).rejects.toThrowError(NotFoundException);
      });
    });
  
    describe('findOneByEmail', () => {
      it('should return user by email', async () => {
        const user = { id: 1, email: 'example@example.com' };
        mockUserRepository.findOneBy.mockResolvedValue(user);
  
        const result = await service.findOneByEmail('example@example.com');
  
        expect(result).toEqual(user);
      });
  
      it('should throw NotFoundException if user not found', async () => {
        mockUserRepository.findOneBy.mockResolvedValue(null);
  
        await expect(service.findOneByEmail('example@example.com')).rejects.toThrowError(NotFoundException);
      });
    });
  
    describe('findOneByEmailForVerification', () => {
      it('should return user by email for verification', async () => {
        const user = { id: 1, email: 'example@example.com' };
        mockUserRepository.findOneBy.mockResolvedValue(user);
  
        const result = await service.findOneByEmailForVerification('example@example.com');
  
        expect(result).toEqual(user);
      });
  
      it('should return null if user not found', async () => {
        mockUserRepository.findOneBy.mockResolvedValue(null);
  
        const result = await service.findOneByEmailForVerification('example@example.com');
  
        expect(result).toBeNull();
      });
    });
  
    describe('updateMyInfo', () => {
      it('should update user info', async () => {
        const user = { id: 1, email: 'example@example.com' };
        const updateMyInfoDto = { name: 'New Name', email: 'new@example.com' };
        mockUserRepository.findOneBy.mockResolvedValue(user);
        mockUserRepository.save.mockResolvedValue({ ...user, ...updateMyInfoDto });
  
        const result = await service.updateMyInfo(1, updateMyInfoDto);
  
        expect(result).toEqual({ ...user, ...updateMyInfoDto });
      });
  
      it('should throw error if user not found', async () => {
        mockUserRepository.findOneBy.mockResolvedValue(null);
  
        await expect(service.updateMyInfo(1, { name: 'newName', email: 'newEmail@email.com' })).rejects.toThrowError('Failed to update user info');

      });
    });
  
    describe('deleteId', () => {
      it('should delete user by id', async () => {
        const user = { id: 1, email: 'example@example.com' };
        mockUserRepository.findOneBy.mockResolvedValue(user);
  
        await service.deleteId(1);
  
        expect(mockUserRepository.softDelete).toHaveBeenCalledWith({ id: 1 });
      });
  
      it('should throw NotFoundException if user not found', async () => {
        mockUserRepository.findOneBy.mockResolvedValue(null);
  
        await expect(service.deleteId(1)).rejects.toThrowError(NotFoundException);
      });
    });
  });
  