import { Test, TestingModule } from '@nestjs/testing';
import { SoccerfieldService } from './soccerfield.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SoccerField } from '../match/entities/soccer-field.entity';
import { Repository,DataSource,Like} from 'typeorm';
import { CommonService } from '../common/common.service';
import { PaginateFieldDto } from './dtos/paginate-field-dto';

jest.mock('../common/common.service', () => ({
  CommonService: jest.fn().mockImplementation(() => ({
  })),
}));

type MockType<T> = {
  [P in keyof T]?: jest.Mock<{}>;
};

describe('SoccerfieldService', () => {
  let service: SoccerfieldService;
  let soccerFieldRepository: MockType<Repository<SoccerField>>;
  //let mockCommonService: jest.Mocked<CommonService>;
  const mockCommonService = {
    paginate: jest.fn(),
  };
  let dataSourceMock: MockType<DataSource>;
  let mockSoccerFieldRepository: jest.Mocked<Repository<SoccerField>>;
  let mockDataSource: jest.Mocked<DataSource>;

  beforeEach(async () => {
    dataSourceMock = {
      getRepository: jest.fn().mockReturnValue({
        createQueryBuilder: jest.fn(() => ({
          where: jest.fn().mockReturnThis(),
          getOne: jest.fn().mockResolvedValue({ id: 1, name: 'Test Stadium' }),
        })),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SoccerfieldService,
        {
          provide: getRepositoryToken(SoccerField),
          useValue: {},
        },
        {
          provide: DataSource,
          useValue: dataSourceMock,
        },
        {
          provide: CommonService,
          useValue: mockCommonService, // 수정된 부분
        },
      ],
    }).compile();

    service = module.get<SoccerfieldService>(SoccerfieldService);
    //mockCommonService = module.get(CommonService);
    mockDataSource = module.get(DataSource);
    mockSoccerFieldRepository = module.get(getRepositoryToken(SoccerField));
  });

  it('findOneStadium should return a stadium for a given id', async () => {
    const soccerFieldId = 1;
    const result = await service.findOneStadium(soccerFieldId);
    expect(result).toEqual({ id: 1, name: 'Test Stadium' });
  });

  // it('should call commonService.paginate with correct parameters including filters from PaginateFieldDto', async () => {
  //   const userId = 1;
  //   const dto = new PaginateFieldDto();
  //   dto.name = 'SomeName';
  //   dto.region = 'SomeRegion';
  
  //   mockCommonService.paginate.mockResolvedValue({
  //     data: [],
  //     total: 0,
  //   });
  
  //   await service.findAllStadium(userId, dto);
  
  //   const expectedOptions = {
  //     relations: ['locationfield'],
  //     where: {
  //       field_name: Like(`%${dto.name}%`),
  //       locationfield: {
  //         state: dto.region,
  //       },
  //     },
  //   };
  
  //   expect(mockCommonService.paginate).toHaveBeenCalledWith(
  //     dto,
  //     expect.anything(), 
  //     expect.objectContaining(expectedOptions), 
  //     'soccerfield'
  //   );
  // });
  

  it('should handle calls without optional filters', async () => {
    const userId = 1;
    const dto = new PaginateFieldDto(); 

    mockCommonService.paginate.mockResolvedValue({
      data: [],
      total: 0,
    });

    await service.findAllStadium(userId, dto);

    expect(mockCommonService.paginate).toHaveBeenCalledWith(
      dto,
      expect.anything(),
      expect.not.objectContaining({
        where: expect.objectContaining({
          field_name: expect.anything(),
          locationfield: expect.anything(),
        }),
      }),
      'soccerfield'
    );
  });

});
