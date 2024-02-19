import { NotFoundException } from "@nestjs/common/exceptions";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { ProfileService } from "./profile.service";
import { Profile } from "./entities/profile.entity";
import { PaginateProfileDto } from "./dtos/paginate-profile-dto";
import { User } from "src/user/entities/user.entity";
import { Member } from "src/member/entities/member.entity";
import { LocationModel } from "src/location/entities/location.entity";
import { TeamModel } from "src/team/entities/team.entity";
import { Gender } from "src/enums/gender.enum";
import { CommonService } from "src/common/common.service";
import { AwsService } from "src/aws/aws.service";
import { ConfigService } from "@nestjs/config";
import { RedisService } from "src/redis/redis.service";


describe('ProfileService', () => {
  let service: ProfileService;
  let profileRepository: Repository<Profile>;
  let userRepository: Repository<User>;
  let memberRepository: Repository<Member>;
  let locationRepository: Repository<LocationModel>;

  beforeEach(async () => {
    const mockDataSource = {
      getConnection: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        CommonService,
        AwsService,
        ConfigService,
        //RedisService,
        {
          provide: DataSource,
          useValue: mockDataSource, 
        },
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
      expect(result).toBe(mockProfile);
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

      // Mock profile data
      const mockProfile = new Profile();

      // Mock repository methods
      jest.spyOn(profileRepository, 'findAndCount').mockResolvedValue([[mockProfile], 1]);

      // Call the service method
    //const result = await service.paginateProfile(1,1,1,mockProfile );

      // Assertions
     // expect(result).toEqual({ profiles: [mockProfile], totalCount: 1 });
      expect(profileRepository.findAndCount).toHaveBeenCalledWith({
        where: {
          gender: 'male',
          name: 'John Doe',
          location: 'New York',
        },
        take: 10,
        skip: 0,
        order: { createdAt: 'ASC' },
      });
    });
  });


  describe('findAllProfiles', () => {
    it('should return all profiles', async () => {
      // Mock profile data
      const mockProfile = new Profile();

      // Mock repository method
      jest.spyOn(profileRepository, 'find').mockResolvedValue([mockProfile]);

      // Call the service method
      const result = await service.findAllProfiles();

      // Assertions
      expect(result).toEqual([mockProfile]);
      expect(profileRepository.find).toHaveBeenCalledWith();
    });

    it('should throw NotFoundException if no profiles are found', async () => {
      // Mock repository method
      jest.spyOn(profileRepository, 'find').mockResolvedValue([]);

      // Call the service method and expect it to throw an exception
      await expect(service.findAllProfiles()).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOneById', () => {
           //given
            //const userId=1;
            //when
            //service.signIn()을 부를때
            //then
            //expect accesstoken&refreshtoken + payload.id ==userId
    it('should return a profile', async () => {
      // Mock profile data
      const mockProfile = new Profile();
      const userId = 1;
      // Mock repository method
      jest.spyOn(profileRepository, 'find').mockResolvedValue([mockProfile]);

      // Call the service method
      const result = await service.findOneById(userId);

      // Assertions
      expect(result).toEqual([mockProfile]);
      expect(profileRepository.find).toHaveBeenCalledWith();
    });

    it('should throw NotFoundException if no profiles are found', async () => {
      // Mock repository method
      jest.spyOn(profileRepository, 'find').mockResolvedValue([]);

      // Call the service method and expect it to throw an exception
      await expect(service.findOneById(1)).rejects.toThrow(NotFoundException);
    });
  });

//   describe('registerProfile', () => {
//     //given
//      //const userId=1;
//      //when
//      //service.signIn()을 부를때
//      //then
//      //expect accesstoken&refreshtoken + payload.id ==userId
// it('should return a profile', async () => {
// // Mock profile data
// const mockProfile = new Profile();
// const userId = 1;
// const profileDto ={};
// const file = "";
// // Mock repository method
// jest.spyOn(profileRepository, 'find').mockResolvedValue([mockProfile]);

// // Call the service method
// const result = await service.registerProfile(userId,profileDto,file);

// // Assertions
// expect(result).toEqual([mockProfile]);
// expect(profileRepository.find).toHaveBeenCalledWith();
// });

// it('should throw NotFoundException if no profiles are found', async () => {
// // Mock repository method
// jest.spyOn(profileRepository, 'find').mockResolvedValue([]);

// // Call the service method and expect it to throw an exception
// await expect(service.findOneById(1)).rejects.toThrow(NotFoundException);
// });
// });
            
});
