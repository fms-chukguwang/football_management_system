import {
    BadRequestException,
    HttpException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { FormationService } from './formation.service';
import { MatchFormation } from '../formation/entities/formation.entity';
import { PlayerStats } from '../match/entities/player-stats.entity';
import { MatchResult } from '../match/entities/match-result.entity';
import { User } from '../user/entities/user.entity';
import { Member } from '../member/entities/member.entity';
import { Match } from '../match/entities/match.entity';

describe('FormationService', () => {
  let service: FormationService;
  let dataSource: DataSource;
  let matchFormationRepositoryMock: {
    find: jest.Mock,
  };
  let memberRepositoryMock: {
    findOne: jest.Mock;
  };

  // mockQueryBuilder의 정의
    const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
        // 예상되는 조회 결과
        { formation: '4-4-2', cnt: '3' },
        { formation: '3-4-3', cnt: '2' },
        { formation: '4-3-3', cnt: '1' },
        ]),
    };
  

  // 모킹된 리포지토리와 서비스를 위한 변수
  const mockMatchFormationRepository = {
    find: jest.fn().mockReturnValue({
        team_id : 1,
        match_id: 2
    }),
    create: jest.fn().mockReturnValue({
        id: 1,
        team_id: 1,
        match_id: 1,
        member_id: 1,
        formation: '4-4-2',
        position: 'FW',
    }),
    save: jest.fn().mockResolvedValue({
        id: 1,
        team_id: 1,
        match_id: 1,
        member_id: 1,
        formation: '4-4-2',
        position: 'FW',
      }),
    
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    
  };
  const mockPlayerStatsRepository = {};
  const mockMatchResultRepository = {};
  const mockUserRepository = {};
  const mockMemberRepository = {};
  const mockMatchRepository = {};
  const mockDataSource = { createQueryRunner: jest.fn() };

  beforeEach(async () => {
    matchFormationRepositoryMock = {
        find: jest.fn(),
    };
    memberRepositoryMock = {
        findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FormationService,
        { provide: getRepositoryToken(MatchFormation), useValue: mockMatchFormationRepository },
        { provide: getRepositoryToken(PlayerStats), useValue: mockPlayerStatsRepository },
        { provide: getRepositoryToken(MatchResult), useValue: mockMatchResultRepository },
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: getRepositoryToken(Member), useValue: memberRepositoryMock },
        { provide: getRepositoryToken(Match), useValue: mockMatchRepository },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<FormationService>(FormationService);
    dataSource = module.get<DataSource>(DataSource);
  });

  it('팀별 포메이션 조회', async () => {
    // given: 주어진 조건 설정
    const teamId = 1;
    const matchId = 1;
    const mockFormationData = [
      {
        id: 1,
        team_id: teamId,
        match_id: matchId,
        member_id: 1,
        position: 'FW',
        member: {
          id: 1,
          name: 'John Doe',
          user: {
            id: 1,
            name: 'John Doe',
          },
        },
      },
    ];
    const mockMemberData = {
      id: 1,
      name: 'John Doe',
      user: {
        id: 1,
        name: 'John Doe',
      },
    };
  
    // 모킹된 리포지토리의 반환값 설정
    mockMatchFormationRepository.find = jest.fn().mockResolvedValue(mockFormationData);
    memberRepositoryMock.findOne = jest.fn().mockResolvedValue(mockMemberData);
  
    // when: 실행할 동작
    const result = await service.getMatchFormation(teamId, matchId);
  
    // then: 예상 결과 검증
    expect(mockMatchFormationRepository.find).toHaveBeenCalledWith({
      where: { team_id: teamId, match_id: matchId },
      relations: { member: true },
    });
    expect(result).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: expect.any(Number),
        team_id: teamId,
        match_id: matchId,
        member_id: expect.any(Number),
        position: expect.any(String),
        member: expect.objectContaining({
          id: expect.any(Number),
          name: expect.any(String),
          user: expect.objectContaining({
            id: expect.any(Number),
            name: expect.any(String),
          }),
        }),
      }),
    ]));
  });

  it('기존 포메이션 정보를 삭제하고 새로운 포메이션 정보를 저장', async () => {
    // given: 주어진 조건 설정
    const teamId = 1;
    const matchId = 2;
    const updateFormationDto = {
      currentFormation: '4-4-2',
      playerPositions: [
        { id: 1, name: '홍길동', position: 'FW' },
        // 다른 플레이어 포지션들...
      ],
    };
    
    //const mockFormationData = []; // 기존 포메이션 데이터가 없다고 가정
    // 비어 있지 않은 배열로 mockFormationData 설정
    const mockFormationData = [{ id: 1, team_id: teamId, match_id: matchId }];

    // 모킹된 메서드들의 반환값 설정
    service.getMatchFormation = jest.fn().mockResolvedValue(mockFormationData);
    mockDataSource.createQueryRunner = jest.fn().mockReturnValue({
      connect: jest.fn().mockResolvedValue(null),
      startTransaction: jest.fn().mockResolvedValue(null),
      manager: {
        delete: jest.fn().mockResolvedValue(null),
        save: jest.fn().mockResolvedValue(null),
      },
      commitTransaction: jest.fn().mockResolvedValue(null),
      rollbackTransaction: jest.fn().mockResolvedValue(null),
      release: jest.fn().mockResolvedValue(null),
    });

    // when: 실행할 동작
    const result = await service.saveMatchFormation(teamId, matchId, updateFormationDto);

    // then: 예상 결과 검증
    expect(service.getMatchFormation).toHaveBeenCalledWith(teamId, matchId);
    expect(mockDataSource.createQueryRunner().connect).toHaveBeenCalled();
    expect(mockDataSource.createQueryRunner().startTransaction).toHaveBeenCalled();
    expect(mockDataSource.createQueryRunner().manager.delete).toHaveBeenCalledWith('match_formations', // 첫 번째 인자로 테이블 이름 추가
    {
      team_id: teamId,
      match_id: matchId,
    });
    expect(mockDataSource.createQueryRunner().manager.save).toHaveBeenCalled(); // 이 호출은 여러 번 발생할 수 있습니다.
    expect(mockDataSource.createQueryRunner().commitTransaction).toHaveBeenCalled();
    expect(mockDataSource.createQueryRunner().release).toHaveBeenCalled();
  });

  it('데이터베이스 작업 중 오류 발생 시 롤백', async () => {
    // given: 주어진 조건 설정
    const teamId = 1;
    const matchId = 2;
    const updateFormationDto = {
      currentFormation: '4-4-2',
      playerPositions: [
        { id: 1, name: '홍길동', position: 'FW' },
        // 다른 플레이어 포지션들...
      ],
    };
    const mockError = new Error('Database operation failed');
  
    // 모킹된 메서드들의 반환값 설정, 여기서 manager.save 메서드가 예외를 던지도록 설정
    service.getMatchFormation = jest.fn().mockResolvedValue([]); // 기존 포메이션 데이터가 없다고 가정
    // 데이터베이스 작업 중 오류 발생 시 롤백 테스트 케이스 내에서
    mockDataSource.createQueryRunner = jest.fn().mockReturnValue({
        connect: jest.fn().mockResolvedValue(null),
        startTransaction: jest.fn().mockResolvedValue(null),
        manager: {
        delete: jest.fn().mockResolvedValue(null),
        save: jest.fn().mockRejectedValue(new InternalServerErrorException('서버 에러가 발생했습니다.')), // 메시지 수정
        },
        commitTransaction: jest.fn().mockResolvedValue(null),
        rollbackTransaction: jest.fn().mockResolvedValue(null),
        release: jest.fn().mockResolvedValue(null),
    });

    // when: 실행할 동작 및 then: 예상 결과 검증
    await expect(service.saveMatchFormation(teamId, matchId, updateFormationDto))
      .rejects.toThrow('서버 에러가 발생했습니다.'); // 예외가 전달되는지 확인
  
    // 롤백이 호출되었는지 검증
    expect(mockDataSource.createQueryRunner().rollbackTransaction).toHaveBeenCalled();
    // 커밋은 호출되지 않음
    expect(mockDataSource.createQueryRunner().commitTransaction).not.toHaveBeenCalled();
    // 리소스 해제 호출 검증
    expect(mockDataSource.createQueryRunner().release).toHaveBeenCalled();
  });
  
    mockMatchFormationRepository.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);
  
  it('가장 인기 있는 포메이션 조회', async () => {
    // when: 실행할 동작
    const result = await service.getPopularFormation();
  
    // then: 예상 결과 검증
    expect(mockMatchFormationRepository.createQueryBuilder).toHaveBeenCalled();
    expect(result).toEqual(expect.arrayContaining([
      expect.objectContaining({
        formation: expect.any(String),
        cnt: expect.any(String),
      }),
    ]));
  });

  // 추가 테스트 케이스를 여기에 작성합니다.
});