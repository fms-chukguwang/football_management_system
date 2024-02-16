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
    let getTeamMatchInfoMock: jest.Mock;

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
    const mockPlayerStatsRepository = {
        find: jest.fn()
    };
    const mockMatchResultRepository = {};
    const mockUserRepository = {};
    const mockMemberRepository = {
        findOne: jest.fn().mockImplementation(({ where }) => 
        Promise.resolve({
        id: where.id,
        user: {
            name: '홍길동', // 예시 데이터
        },
        })
    ),
    };
    const mockMatchRepository = {
        find:jest.fn()
    };
    const mockDataSource = { 
        createQueryRunner: jest.fn(),
        query: jest.fn().mockResolvedValue([
            { member_id: 1, yellowCards: 2 },
            { member_id: 2, yellowCards: 1 },
          ]),
    };

  beforeEach(async () => {
    matchFormationRepositoryMock = {
        find: jest.fn(),
    };
    memberRepositoryMock = {
        findOne: jest.fn().mockImplementation(({ where }) => 
        Promise.resolve({
            id: where.id,
            user: {
                name: '홍길동', // 예시 데이터
            },
            })
        ),
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

  describe('getMatchFormation - 팀별 포메이션 조회', () => {

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

});

  describe('saveMatchFormation - 팀별 포메이션 저장', () => {

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

  it('최근 3경기간 최다 누적 경고자 조회', async () => {

    const teamId = 1;

    const mockQueryResult = [
        { member_id: 1, yellowCards: 2 },
        { member_id: 2, yellowCards: 1 },
        // 다른 결과들...
      ];
      const mockMemberData = {
        id: 1,
        user: {
          id: 1,
          name: '홍길동',
        },
      };

    // 모킹된 dataSource.query의 반환값 설정
    dataSource.query = jest.fn().mockResolvedValue(mockQueryResult);
      
    const result = await service.getWarningmember(teamId);

    expect(mockDataSource.query).toHaveBeenCalledWith(expect.any(String), [teamId, teamId]);
    expect(memberRepositoryMock.findOne).toHaveBeenCalledTimes(2);
    expect(result).toEqual(expect.arrayContaining([
      expect.objectContaining({
        member_id: expect.any(Number),
        yellowCards: expect.any(Number),
        memberData: expect.objectContaining({
          id: expect.any(Number),
          user: expect.objectContaining({
            name: expect.any(String),
          }),
        }),
      }),
    ]));
  });

  describe('getTeamMatchInfo - 해당팀 경기결과(승,무,패), 포메이션 조회', () => {
    const homeTeamId = 1; // 예제 팀 ID
    const mockMatchList = [
      { id: 1, home_team_id: homeTeamId, away_team_id: 2 },
      // 여기에 더 많은 경기 정보를 추가할 수 있습니다.
    ];
    const mockPlayerStats = [
      { match_id: 1, team_id: homeTeamId, goals: 2 }, // 홈팀 골
      { match_id: 1, team_id: 2, goals: 1 }, // 상대팀 골
      // 여기에 더 많은 선수 통계를 추가할 수 있습니다.
    ];
    const mockFormation = [
      { match_id: 1, formation: "4-4-2" },
      // 여기에 더 많은 포메이션 정보를 추가할 수 있습니다.
    ];
  
    beforeEach(() => {
      mockMatchRepository.find.mockResolvedValue(mockMatchList);
      mockPlayerStatsRepository.find.mockImplementation(({ where: { match_id } }) =>
        Promise.resolve(mockPlayerStats.filter(stat => stat.match_id === match_id))
      );
      mockMatchFormationRepository.find.mockResolvedValue(mockFormation);
    });
  
    it('해당 팀의 경기 결과와 포메이션 정보를 정확히 조회해야 함', async () => {
      const result = await service.getTeamMatchInfo(homeTeamId);
  
      expect(mockMatchRepository.find).toHaveBeenCalledWith({
        where: [{ home_team_id: homeTeamId }, { away_team_id: homeTeamId }],
      });
      expect(mockPlayerStatsRepository.find).toHaveBeenCalled();
      expect(mockMatchFormationRepository.find).toHaveBeenCalled();
      expect(result).toEqual(expect.arrayContaining([
        expect.objectContaining({
          match_id: expect.any(Number),
          result: expect.any(Number),
          formation: expect.any(String),
        }),
      ]));
    });
  });

  describe('calculateFormationWinRate - 포메이션별 승률 계산', () => {
    interface MatchResultDetail {
        match_id: number;
        result: number; // 1: 승리, 0: 무승부, -1: 패배
        formation: string;
    }

    it('포메이션별 승률을 올바르게 계산해야 한다', async () => {
      // 샘플 경기 결과 데이터
      const matchList: MatchResultDetail[] = [
        { match_id: 1, result: 1, formation: '4-4-2' }, // 승리
        { match_id: 2, result: -1, formation: '4-4-2' }, // 패배
        { match_id: 3, result: 1, formation: '3-5-2' }, // 승리
        { match_id: 4, result: 1, formation: '4-4-2' }, // 승리
      ];

      // 함수 실행
      const winRateMap = await service.calculateFormationWinRate(matchList);

      // 예상되는 결과
      expect(winRateMap.get('4-4-2')).toEqual({
        winRate: 2 / 3, // 승리 2번 / 총 3번 경기
        loseRate: 1 / 3, // 패배 1번 / 총 3번 경기
        games: 3 // 총 3번 경기
      });

      expect(winRateMap.get('3-5-2')).toEqual({
        winRate: 1 / 1, // 승리 1번 / 총 1번 경기
        loseRate: 0 / 1, // 패배 0번 / 총 1번 경기
        games: 1 // 총 1번 경기
      });
    });
  });

  

  describe('getBestFormation - 최적 포메이션 조회', () => {

    beforeEach(() => {
        // getTeamMatchInfo 메서드 모킹
        jest.spyOn(service, 'getTeamMatchInfo').mockImplementation(async (teamId: number) => {
            if (teamId === 1) { // 홈팀의 경우
                return [
                { match_id: 1, result: 1, formation: '4-4-2' },
                { match_id: 2, result: 1, formation: '3-4-3' },
                { match_id: 5, result: 1, formation: '4-2-3-1' },
                { match_id: 6, result: 0, formation: '4-5-1' },
                { match_id: 7, result: 1, formation: '4-3-3' }
                ];
            } else if (teamId === 2) { // 상대팀의 경우
                return [
                { match_id: 3, result: -1, formation: '4-4-2' },
                { match_id: 4, result: -1, formation: '3-5-2' },
                { match_id: 8, result: -1, formation: '5-4-1' },
                { match_id: 9, result: 0, formation: '3-6-1' },
                { match_id: 10, result: -1, formation: '4-1-4-1' }
                ];
            }
        });
        
        // calculateFormationWinRate 메서드 모킹
        jest.spyOn(service, 'calculateFormationWinRate').mockImplementation(async (matchList) => {
            const formationWinRates = new Map();
            // 수정된 로직을 기반으로 모킹 결과 설정
            formationWinRates.set('4-4-2', { winRate: 0.5, loseRate: 0.5, games: 5 });
            formationWinRates.set('4-3-3', { winRate: 1.0, loseRate: 0.0, games: 2 });
            formationWinRates.set('3-5-2', { winRate: 0.0, loseRate: 1.0, games: 2 });
            formationWinRates.set('3-4-3', { winRate: 1.0, loseRate: 0.0, games: 1 });
            formationWinRates.set('4-2-3-1', { winRate: 1.0, loseRate: 0.0, games: 1 });
            formationWinRates.set('4-5-1', { winRate: 0.0, loseRate: 0.0, games: 1 }); // 무승부 포함
            formationWinRates.set('5-4-1', { winRate: 0.0, loseRate: 1.0, games: 1 });
            formationWinRates.set('3-6-1', { winRate: 0.0, loseRate: 0.0, games: 1 }); // 무승부 포함
            formationWinRates.set('4-1-4-1', { winRate: 0.0, loseRate: 1.0, games: 1 });
            return formationWinRates;
        });
    });

    afterEach(() => {
        // 테스트가 끝난 후 모킹을 복원합니다.
        jest.restoreAllMocks();
    });

    it('최적 포메이션과 승리 확률을 올바르게 계산해야 한다', async () => {
      const homeTeamId = 1;
      const opponentTeamId = 2;

      // 함수 실행
      const result = await service.getBestFormation(homeTeamId, opponentTeamId);

      // 예상되는 결과
      expect(result).toEqual({
        formation1: '4-3-3', // 홈 팀 최고 승률 포메이션
        formation2: '3-5-2', // 상대 팀 최고 패배율 포메이션
        winProbability: 0.5 // 가정된 승리 확률 계산 로직에 따라
      });
    });
  });

  // 추가 테스트 케이스를 여기에 작성합니다.
});
