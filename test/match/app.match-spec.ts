import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { faker } from '@faker-js/faker';
import { AppModule } from '../../src/app.module';
import { Formation, formations } from  './formation';



enum Time {
    time = '10:00:00',
    time1 = '12:00:00',
    time2 = '14:00:00',
    time3 = '16:00:00',
    time4 = '18:00:00',
    time5 = '20:00:00',
}

enum Position {
    Goalkeeper = 'Goalkeeper',
    CenterBack = 'Center Back',
    RightBack = 'Right Back',
    LeftBack = 'Left Back',
    DefensiveMidfielder = 'Defensive Midfielder',
    CentralMidfielder = 'Central Midfielder',
    AttackingMidfielder = 'Attacking Midfielder',
    Striker = 'Striker',
    Forward = 'Forward',
    RightWinger = 'Right Winger',
    LeftWinger = 'Left Winger',
}

interface Owner {
    id: number;
    creator: Creator;
}

interface Creator {
    email: string;
  }

interface Field {
id: number;
}

interface Member {
    id: number;
}

function getRandomTime(): Time {
    const time = Object.values(Time);
    const randomIndex = Math.floor(Math.random() * time.length);
    return time[randomIndex];
}

function getRandomPosition(): Position {
    const positions = Object.values(Position);
    const randomIndex = Math.floor(Math.random() * positions.length);
    return positions[randomIndex];
}

function homePickTwoUniquehomeMemberIds(homeMemberIds: number[]): [number, number] {
    const shuffled = [...homeMemberIds].sort(() => 0.5 - Math.random());
    return [Number(shuffled[0]), Number(shuffled[1])];
}

function awayPickTwoUniquehomeMemberIds(awayMemberIds: number[]): [number, number] {
    const shuffled = [...awayMemberIds].sort(() => 0.5 - Math.random());
    return [Number(shuffled[0]), Number(shuffled[1])];
}

let app: INestApplication;

let accessTokenHome: string;
let homeTeamId: number;
let homeMemberIds: number[] = [];

let accessTokenAway: string;
let awayTeamId: number;
let awayOwnerEmail: string;
let awayMemberIds: number[] = [];

let fieldId: number;
let matchId: number;


// awayTeamId = 68;
// matchId = 2;
// awayOwnerEmail = 'Andreane_Rempel@gmail.com';


  //시나리오 1: 홈팀 구단주 로그인 후 경기 생성
  describe('AppController (match) - 시나리오 1: 홈팀 구단주 로그인 후 경기 생성', () => {
    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();

        await app.init();
    }, 10000);

    // 1) 홈팀 구단주 로그인
    it('/auth/sign-in (POST)', async () => {
        const SignInDto = {
            email: "example2@example.com",
            password: 'Ex@mp1e!!',
        };

        const response = await request(app.getHttpServer())
            .post('/auth/sign-in')
            .send(SignInDto)
            .expect(200);
            accessTokenHome = response.body.data.accessToken;
    });

    // 2) 홈팀 구단주 검증
    it('/match/creator (GET)', async () => {

        const response = await request(app.getHttpServer())
            .get('/match/creator')
            .set('Authorization', `Bearer ${accessTokenHome}`)
            .expect(200);

        const responseData = response.body.data;
        const homeOwnerData = Object.values(responseData);

        const homeOwner = homeOwnerData[0] as Owner;
        homeTeamId = homeOwner.id;
    });

    // 3) 상대팀 구단주 명단 가져오기 (경기할 상대팀 지정)
    it('/match/owners (GET)', async () => {

        const response = await request(app.getHttpServer())
            .get('/match/owners')
            .set('Authorization', `Bearer ${accessTokenHome}`)
            .expect(200);
        const owners = response.body.data;

        const ownersData = Object.values(owners);
        const randomIndex = Math.floor(Math.random() * ownersData.length);

        const randomOwner = ownersData[randomIndex] as Owner;
        awayTeamId = randomOwner.id;
        awayOwnerEmail = randomOwner.creator.email;
        console.log('awayOwnerEmail:',awayOwnerEmail);
    });

    // 4) 경기장 랜덤 가져오기
    it('/match/field (GET)', async () => {

        const response = await request(app.getHttpServer())
            .get('/match/field')
            .set('Authorization', `Bearer ${accessTokenHome}`)
            .expect(200);
        const responseData = response.body.data;

        const fieldsData = Object.values(responseData);
        const randomIndex = Math.floor(Math.random() * fieldsData.length);

        const randomField = fieldsData[randomIndex] as Field;
        fieldId = randomField.id;

        console.log('fieldsData[randomIndex]:',fieldsData[randomIndex]);
        console.log('fieldId:',fieldId);
    });

    //5) 경기 생성
    it('/match/book/accept (POST)', async () => {
        const startDate = new Date('2024-01-20T00:00:00.000Z');
        const endDate = new Date(); // 현재 날짜
        endDate.setMonth(endDate.getMonth() + 1); // 현재 날짜에서 한 달을 더함

        const randomDate = faker.date.between({ from: startDate, to: endDate });

        // ISO 8601 형식으로 날짜를 문자열로 변환
        const isoDateString = randomDate.toISOString();

        // 날짜 부분만 추출 (YYYY-MM-DD)
        const onlyDate = isoDateString.split('T')[0];

        console.log('onlyDate:',onlyDate);

        const registerMatchDto = {
            date: onlyDate,
            time: getRandomTime(),
            homeTeamId,
            awayTeamId,
            fieldId,
            token: `${accessTokenHome}`,
        };

        console.log('registerMatchDto:',registerMatchDto);

        const response = await request(app.getHttpServer())
            .post(`/match/book/accept`)
            .set('Authorization', `Bearer ${accessTokenHome}`)
            .send({
                date: registerMatchDto.date,
                time: registerMatchDto.time,
                homeTeamId: Number(registerMatchDto.homeTeamId),
                awayTeamId: Number(registerMatchDto.awayTeamId),
                fieldId: Number(registerMatchDto.fieldId),
                token: registerMatchDto.token,
        })
        .expect(201);

        const parsedResponse = JSON.parse(response.text);
        matchId = parsedResponse.id;
        console.log('matchId=', matchId);
    });

    afterAll(async () => {
        await app.close();
    });
});

  //시나리오 2: 홈팀 경기결과 등록
  describe('AppController (match) - 시나리오 2: 홈팀 경기결과 등록', () => {
    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();

        await app.init();
    }, 10000);

    // 1) 홈팀 멤버조회
    it(`/team/:teamId/members (GET)`, async () => {

        const response = await request(app.getHttpServer())
            .get(`/team/${homeTeamId}/members`)
            .set('Authorization', `Bearer ${accessTokenHome}`)
            .expect(200);
        const responseData = response.body;

        const membersData = Object.values(responseData) as Member[];
        homeMemberIds = membersData.map(member => member.id);

        // 1-1)  홈팀 멤버 5명 미만이면 더미 회원정보 생성
        while (homeMemberIds.length < 5) {

            // 1-1-1) 더미데이터 회원가입
            const signUpDto = {
                passwordConfirm: 'Ex@mp1e!!',
                email: faker.internet.email(),
                password: 'Ex@mp1e!!',
                name: faker.person.fullName(),
            };

            const dummyResponse = await request(app.getHttpServer())
                .post('/auth/sign-up')
                .send(signUpDto)
                .expect(201);

            const dummyAccessToken = dummyResponse.body.data.accessToken;

            console.log('dummyAccessToken:',dummyAccessToken);

            // 1-1-2) 더미데이터 프로필 생성
            const registerPorfileDto = {
                preferredPosition: getRandomPosition(),
                weight: faker.number.int({ min: 40, max: 100 }),
                height: faker.number.int({ min: 150, max: 190 }),
                age: faker.number.int({ min: 18, max: 50 }),
                gender: 'Male',
            };
    
            const response = await request(app.getHttpServer())
                .post('/profile')
                .set('Authorization', `Bearer ${dummyAccessToken}`)
                .send(registerPorfileDto)
                .expect(201);
       
            const dummyUserId = response.body.data.user.id;

            console.log('dummyUserId:',dummyUserId);

            // 1-1-3) 더미데이터 홈팀 멤버로 추가
            const memberResponse = await request(app.getHttpServer())
            .post(`/team/${homeTeamId}/user/${dummyUserId}`)
            .set('Authorization', `Bearer ${accessTokenHome}`)
            .expect(201);

            const dummyMemberId = memberResponse.body.data.id;

            console.log('dummyMemberId:',dummyMemberId);

            homeMemberIds.push(dummyMemberId); // 마지막 id를 다시 추가

        }
        
        console.log('homeMemberIds:',homeMemberIds);
    });

    // 2) 경기 후 홈팀 기록 등록
    it('/match/:metchId/result (POST)', async () => {

        const [memberId1, memberId2] = homePickTwoUniquehomeMemberIds(homeMemberIds);

        const substitutions = Math.random() < 0.5 ? [] : [{ inPlayerId: `${memberId1}`, outPlayerId: `${memberId2}` }];

        console.log('substitutions:',substitutions);
        const teamResultDto = {
            cornerKick: faker.number.int({ min: 0, max: 10 }),
            substitions: substitutions,
            passes: faker.number.int({ min: 0, max: 500 }),
            penaltyKick: faker.number.int({ min: 0, max: 5 }),
            freeKick: faker.number.int({ min: 0, max: 10 }),
        };

        console.log('teamResultDto:',teamResultDto);

        const response = await request(app.getHttpServer())
            .post(`/match/${matchId}/result`)
            .set('Authorization', `Bearer ${accessTokenHome}`)
            .send({
                cornerKick: teamResultDto.cornerKick,
                substitions: teamResultDto.substitions,
                passes: teamResultDto.passes,
                penaltykICK: teamResultDto.penaltyKick,
                freeKick: teamResultDto.freeKick,
            })
            .expect(201);

        console.log('match team result', response.body);
    },1000000);

    afterAll(async () => {
        await app.close();
        });
    });

  //시나리오 3: 홈팀 선수별 경기결과 등록
  describe('AppController (match) - 시나리오 3: 홈팀 선수별 경기결과 등록', () => {
    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();

        await app.init();
    }, 10000);

    // 1) 홈팀 멤버전체 결과 등록
    it(`/match/:matchId/result/member (POST)`, async () => {

        const yellowCards = Math.random() < 0.7 ? 0 : 1;
        const redCards = Math.random() < 0.9 ? 0 : 1;

        // const results = homeMemberIds.map(memberId => ({
        //     memberId: memberId,
        //     assists: faker.number.int({ min: 0, max: 5 }), 
        //     goals: faker.number.int({ min: 0, max: 5 }), 
        //     yellowCards, 
        //     redCards, 
        //     save: faker.number.int({ min: 0, max: 10 }), 
        //   }));

          const results = [];
          for (let i = 0; i < homeMemberIds.length; i++) {
            const memberId = homeMemberIds[i];
            const assists = faker.number.int({ min: 0, max: 5 });
            const goals = faker.number.int({ min: 0, max: 5 });
            const yellowCards = Math.random() < 0.7 ? 0 : 1;
            const redCards = Math.random() < 0.9 ? 0 : 1;
            const save = faker.number.int({ min: 0, max: 10 });
          
            results.push({
              memberId,
              assists,
              goals,
              yellowCards,
              redCards,
              save,
            });
          }

        const response = await request(app.getHttpServer())
            .post(`/match/${matchId}/result/member`)
            .set('Authorization', `Bearer ${accessTokenHome}`)
            .send({results})
            .expect(201);
        const responseData = response.body;

        const membersData = Object.values(responseData);
        console.log('membersData:',membersData);
    },1000000);

    afterAll(async () => {
        await app.close();
        });
    });

  //시나리오 4: 어웨이팀 경기결과 등록
  describe('AppController (match) - 시나리오 4: 어웨이팀 경기결과 등록', () => {
    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();

        await app.init();
    }, 10000);

    // 1) 어웨이팀 구단주 로그인
    it('/auth/sign-in (POST)', async () => {
        const SignInDto = {
            email: awayOwnerEmail,
            password: 'Ex@mp1e!!',
        };

        const response = await request(app.getHttpServer())
            .post('/auth/sign-in')
            .send(SignInDto)
            .expect(200);
            accessTokenAway = response.body.data.accessToken;
    });

    // 2) 어웨이팀 구단주 검증
    it('/match/creator (GET)', async () => {

        const response = await request(app.getHttpServer())
            .get('/match/creator')
            .set('Authorization', `Bearer ${accessTokenAway}`)
            .expect(200);

        const responseData = response.body.data;
        const awayOwnerData = Object.values(responseData);

        const awayOwner = awayOwnerData[0] as Owner;
        awayTeamId = awayOwner.id;
    });

    // 3) 어웨이팀 멤버조회
    it(`/team/:teamId/members (GET)`, async () => {

        console.log('awayTeamId:',awayTeamId);

        const response = await request(app.getHttpServer())
            .get(`/team/${awayTeamId}/members`)
            .set('Authorization', `Bearer ${accessTokenAway}`)
            .expect(200);
        const responseData = response.body;

        const membersData = Object.values(responseData) as Member[];
        awayMemberIds = membersData.map(member => member.id);

        // 3-1)  어웨이팀 멤버 5명 미만이면 더미 회원정보 생성
        while (awayMemberIds.length < 5) {

            // 3-1-1) 더미데이터 회원가입
            const signUpDto = {
                passwordConfirm: 'Ex@mp1e!!',
                email: faker.internet.email(),
                password: 'Ex@mp1e!!',
                name: faker.person.fullName(),
            };

            const dummyResponse = await request(app.getHttpServer())
                .post('/auth/sign-up')
                .send(signUpDto)
                .expect(201);

            const dummyAccessToken = dummyResponse.body.data.accessToken;

            // 3-1-2) 더미데이터 프로필 생성
            const registerPorfileDto = {
                preferredPosition: getRandomPosition(),
                weight: faker.number.int({ min: 40, max: 100 }),
                height: faker.number.int({ min: 150, max: 190 }),
                age: faker.number.int({ min: 18, max: 50 }),
                gender: 'Male',
            };
    
            const response = await request(app.getHttpServer())
                .post('/profile')
                .set('Authorization', `Bearer ${dummyAccessToken}`)
                .send(registerPorfileDto)
                .expect(201);
       
            const dummyUserId = response.body.data.user.id;

            // 3-1-3) 더미데이터 어웨이팀 멤버로 추가
            const memberResponse = await request(app.getHttpServer())
            .post(`/team/${awayTeamId}/user/${dummyUserId}`)
            .set('Authorization', `Bearer ${accessTokenAway}`)
            .expect(201);

            const dummyMemberId = memberResponse.body.data.id;

            awayMemberIds.push(dummyMemberId); // 마지막 id를 다시 추가

        }
        
        console.log('awayMemberIds:',awayMemberIds);
    },5000000);

    // 4) 경기 후 어웨이팀 기록 등록
    it('/match/:metchId/result (POST)', async () => {

        const [memberId1, memberId2] = awayPickTwoUniquehomeMemberIds(awayMemberIds);

        const substitutions = Math.random() < 0.5 ? [] : [{ inPlayerId: `${memberId1}`, outPlayerId: `${memberId2}` }];

        const teamResultDto = {
            cornerKick: faker.number.int({ min: 0, max: 10 }),
            substitions: substitutions,
            passes: faker.number.int({ min: 0, max: 500 }),
            penaltyKick: faker.number.int({ min: 0, max: 5 }),
            freeKick: faker.number.int({ min: 0, max: 10 }),
        };

        const response = await request(app.getHttpServer())
            .post(`/match/${matchId}/result`)
            .set('Authorization', `Bearer ${accessTokenAway}`)
            .send({
                cornerKick: teamResultDto.cornerKick,
                substitions: teamResultDto.substitions,
                passes: teamResultDto.passes,
                penaltykICK: teamResultDto.penaltyKick,
                freeKick: teamResultDto.freeKick,
            })
            .expect(201);

        console.log('away team result', response.body);
    },5000000);

    afterAll(async () => {
        await app.close();
        });
    });

    //시나리오 6 : 양팀 포메이션, 포지션 추가
    describe('AppController (match) - 시나리오 6 : 양팀 포메이션, 포지션 추가', () => {
    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();

        await app.init();
    }, 10000);

    // 1) 홈팀 포메이션, 포지션 추가
    it(`/match/formation (POST)`, async () => {

        const formationKeys = Object.keys(formations);
        const randomIndex = Math.floor(Math.random() * formationKeys.length);
    
        const randomFormation = formationKeys[randomIndex];
    
        // 선택한 포메이션의 positionNames 가져오기
        const { defenders, midfielders, attackers, goalkeeper } = formations[randomFormation].positionNames;
    
        // 모든 positionNames를 하나의 배열로 합치기
        const allPositionNames = [...defenders, ...midfielders, ...attackers, goalkeeper];
    
    
        // 1) 홈팀 포메이션 생성
        let results = [];
        for (let i = 0; i < homeMemberIds.length; i++) {
    
            const memberId = homeMemberIds[i];
    
            // allPositionNames 배열에서 포지션 할당
            const positionIndex = i % allPositionNames.length; // 중복을 피하기 위해 인덱스 계산
            const position = allPositionNames.splice(positionIndex, 1)[0]; // 해당 포지션 제거
    
        
            results.push({
            id:memberId,
            name:'',
            position,
            });
        }

        const response = await request(app.getHttpServer())
        .post(`/formation/${homeTeamId}/${matchId}`)
        .set('Authorization', `Bearer ${accessTokenHome}`)
        .send({
            currentFormation:randomFormation,
            playerPositions:results
        })
        .expect(201);

        const responseData = response.body;

        const membersData = Object.values(responseData);
        console.log('membersData home formation:',membersData);
    },);

    // 2) 어웨이팀 포메이션, 포지션 추가
    it(`/match/formation (POST)`, async () => {

        const formationKeys = Object.keys(formations);
        const randomIndex = Math.floor(Math.random() * formationKeys.length);
    
        const randomFormation = formationKeys[randomIndex];
    
        // 선택한 포메이션의 positionNames 가져오기
        const { defenders, midfielders, attackers, goalkeeper } = formations[randomFormation].positionNames;
    
        // 모든 positionNames를 하나의 배열로 합치기
        const allPositionNames = [...defenders, ...midfielders, ...attackers, goalkeeper];
    
    
        // 1) 어웨이팀 포메이션 생성
        let results = [];
        for (let i = 0; i < awayMemberIds.length; i++) {
    
            const memberId = awayMemberIds[i];
    
            // allPositionNames 배열에서 포지션 할당
            const positionIndex = i % allPositionNames.length; // 중복을 피하기 위해 인덱스 계산
            const position = allPositionNames.splice(positionIndex, 1)[0]; // 해당 포지션 제거
    
        
            results.push({
            id:memberId,
            name:'',
            position,
            });
        }

        const response = await request(app.getHttpServer())
        .post(`/formation/${awayTeamId}/${matchId}`)
        .set('Authorization', `Bearer ${accessTokenAway}`)
        .send({
            currentFormation:randomFormation,
            playerPositions:results
        })
        .expect(201);

        const responseData = response.body;

        const membersData = Object.values(responseData);
        console.log('membersData away formation:',membersData);
    },);

    afterAll(async () => {
        await app.close();
        });
    });
