import { NotFoundException } from "@nestjs/common/exceptions";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { AwsService } from "src/aws/aws.service";
import { CommonService } from "src/common/common.service";
import { Gender } from "src/enums/gender.enum";
import { LocationModel } from "src/location/entities/location.entity";
import { Member } from "src/member/entities/member.entity";
import { TeamModel } from "src/team/entities/team.entity";
import { User } from "src/user/entities/user.entity";
import { Repository } from "typeorm";
import { PaginateProfileDto } from "./dtos/paginate-profile-dto";
import { Profile } from "./entities/profile.entity";
import { ProfileService } from "./profile.service";

describe('ProfileService', () => {
  let service: ProfileService;
  let profileRepository: Repository<Profile>;
  let userRepository: Repository<User>;
  let memberRepository: Repository<Member>;
  let locationRepository: Repository<LocationModel>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        {
          provide: getRepositoryToken(Profile),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Member),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(LocationModel),
          useClass: Repository,
        },
        CommonService, 
        AwsService, 
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
    profileRepository = module.get<Repository<Profile>>(getRepositoryToken(Profile));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    memberRepository = module.get<Repository<Member>>(getRepositoryToken(Member));
    locationRepository = module.get<Repository<LocationModel>>(getRepositoryToken(LocationModel));
  });

  describe('paginateMyProfile', () => {
    it('should return null if the user is not a staff member', async () => {
      // Mock user data
      const userId = 1;
      const mockUser = new User();
      mockUser.id = userId;

      // Mock profile data
      const mockProfile = new Profile();
      mockProfile.user = mockUser;

      // Mock member data
      const mockMember = new Member();
      mockMember.isStaff = false;

      // Mock repository methods
      jest.spyOn(profileRepository, 'findOne').mockResolvedValue(mockProfile);
      jest.spyOn(memberRepository, 'findOne').mockResolvedValue(mockMember);

      // Mock pagination DTO
      const mockDto: PaginateProfileDto = {
        page: 1,
        take: 10,
        order__createdAt: 'ASC',
      };

      // Call the service method
      const result = await service.paginateMyProfile(userId, mockDto);

      // Assertions
      expect(result).toBeNull();
      expect(profileRepository.findOne).toHaveBeenCalledWith({ where: { user: { id: userId } } });
      expect(memberRepository.findOne).toHaveBeenCalledWith({ where: { user: { id: userId } } });
    });

    it('should return profiles for staff members', async () => {
      // Mock user data
      const userId = 1;
      const mockUser = new User();
      mockUser.id = userId;

      // Mock profile data
      const mockProfile = new Profile();
      mockProfile.user = mockUser;

      // Mock member data
      const mockMember = new Member();
      mockMember.isStaff = true;

      // Mock repository methods
      jest.spyOn(profileRepository, 'findOne').mockResolvedValue(mockProfile);
      jest.spyOn(memberRepository, 'findOne').mockResolvedValue(mockMember);

      // Mock pagination DTO
      const mockDto: PaginateProfileDto = {
        page: 1,
        take: 10,
        order__createdAt: 'ASC',
      };

      // Call the service method
      const result = await service.paginateMyProfile(userId, mockDto);

      // Assertions
     expect(profileRepository.findOne).toHaveBeenCalledWith({ where: { user: { id: userId } } });
     expect(memberRepository.findOne).toHaveBeenCalledWith({ where: { user: { id: userId } } });
    });
  });

  describe('paginateProfile', () => {
    it('should return paginated profiles with given filters', async () => {
      // Mock pagination DTO
      const mockDto: PaginateProfileDto = {
        page: 1,
        take: 10,
        order__createdAt: 'ASC',
      };

      // Call the service method
      const result = await service.paginateProfile(1, mockDto, 'male', 'John Doe', 'New York');

       // Assertions
      //expect(profileRepository.findOne).toHaveBeenCalledWith({ where: { user: { id: userId } } });
    });
  });

  describe('paginateProfileHo', () => {
    it('should return paginated profiles based on team gender', async () => {
      // Mock user data
      const userId = 1;
      const mockUser = new User();
      mockUser.id = userId;

      // Mock team data
      const mockTeam = new TeamModel();
      mockTeam.gender = Gender.Male;

      // Mock profile data
      const mockProfile = new Profile();
      mockProfile.user = mockUser;
      //mockProfile.team = mockTeam;

      // Mock repository methods
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

      // Call the service method
      //const result = await service.paginateProfileHo(userId, mockDto);

      // Assertions
     
    });
  });

  describe('searchProfile', () => {
    it('should return profiles matching the given name', async () => {
      // Mock repository method
      jest.spyOn(profileRepository, 'find').mockResolvedValue([]);

      // Call the service method
      const result = await service.searchProfile('John Doe');

      // Assertions

    });

    it('should return all profiles if no name is provided', async () => {
      // Mock repository method
      jest.spyOn(profileRepository, 'find').mockResolvedValue([]);

      // Call the service method
      const result = await service.searchProfile();

      // Assertions

    });
  });

  describe('findAllProfiles', () => {
    it('should return all profiles', async () => {
      // Mock repository method
      jest.spyOn(profileRepository, 'find').mockResolvedValue([]);

      // Call the service method
      const result = await service.findAllProfiles();

     // Assertions
     expect(result).toBeNull();
     expect(profileRepository.findOne).toHaveBeenCalledWith({ where: { user: true }});
    });

    it('should throw NotFoundException if no profiles are found', async () => {
      // Mock repository method
      jest.spyOn(profileRepository, 'find').mockResolvedValue([]);

      // Call the service method and expect it to throw an exception
      await expect(service.findAllProfiles()).rejects.toThrow(NotFoundException);

        // Assertions
        expect(result).toBeNull();

    });
  });

});
function result(result: any) {
  throw new Error("Function not implemented.");
}

