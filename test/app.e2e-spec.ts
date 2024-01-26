import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { faker } from '@faker-js/faker';
import { SignUpDto } from '../src/auth/dtos/sign-up.dto';
import { SignInDto } from 'src/auth/dtos/sign-in.dto';
import { RegisterProfileInfoDto } from 'src/profile/dtos/register-profile-info';

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

enum Time {
    morning = '10:00:00',
    evening = '20:00:00',
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

let accessToken: string;
let app: INestApplication;
let signUpDto: SignUpDto;
let teamId: number;
let userId: number;
let matchId: number;
let memberId: number;

//시나리오 1 - 모든 새로운 팀 회원들이 구단주가 됨
describe('AppController (e2e) - 시나리오 1: 모든 새로운 팀 회원들이 구단주가 됨', () => {
    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();

        await app.init();
    }, 10000);

    //더미데이터 회원가입
    it('/auth/sign-up (POST)', async () => {
        const signUpDto = {
            passwordConfirm: 'Ex@mp1e!!',
            email: faker.internet.email(),
            password: 'Ex@mp1e!!',
            name: faker.person.fullName(),
        };

        const response = await request(app.getHttpServer())
            .post('/auth/sign-up')
            .send(signUpDto)
            .expect(201);
        accessToken = response.body.data.accessToken;
    });

    //프로필 생성
    it('/profile (POST)', async () => {
        const registerPorfileDto = {
            preferredPosition: getRandomPosition(),
            weight: faker.number.int({ min: 40, max: 100 }),
            height: faker.number.int({ min: 150, max: 190 }),
            age: faker.number.int({ min: 18, max: 50 }),
            gender: 'Male',
        };

        const response = await request(app.getHttpServer())
            .post('/profile')
            .set('Authorization', `Bearer ${accessToken}`)
            .send(registerPorfileDto)
            .expect(201);
    });
    //팀 생성
    it('/team (POST)', async () => {
        //팀을 생성할때 만든 유저는 자동으로 is_staff가 true가 되고 그 팀에 소속됨
        const registerTeamDto = {
            name: faker.lorem.words(2),
            description: faker.lorem.text(),
            gender: 'Male',
            isMixedGender: false,
            postalCode: '12344',
            address: '경기도 화성시 향납',
        };

        const response = await request(app.getHttpServer())
            .post('/team')
            .set('Authorization', `Bearer ${accessToken}`)
            .field('name', registerTeamDto.name)
            .field('description', registerTeamDto.description)
            .field('gender', registerTeamDto.gender)
            .field('isMixedGender', registerTeamDto.isMixedGender)
            .field('postalCode', registerTeamDto.postalCode)
            .field('address', registerTeamDto.address)
            .attach('file', 'src/img/IMG_6407.jpg')
            .expect(201);
        teamId = response.body.data.teamId;
        memberId  = response.body.data.memberId;
        console.log("memberId=",memberId);
    });

    // 경기 생성
    // it('/match/book/accept (POST)', async () => {
    //     const randomDate = faker.date.between(
    //         '2024-01-26T00:00:00.000Z',
    //         '2024-02-28T00:00:00.000Z',
    //     );

    //     // ISO 8601 형식으로 날짜를 문자열로 변환
    //     const isoDateString = randomDate.toISOString();

    //     // 날짜 부분만 추출 (YYYY-MM-DD)
    //     const onlyDate = isoDateString.split('T')[0];

    //     const registerMatchDto = {
    //         date: onlyDate,
    //         time: getRandomTime(),
    //         homeTeamId: teamId,
    //         awayTeamId: teamId - 1,
    //         fieldId: faker.number.int({ min: 1, max: 15 }),
    //         token: `${accessToken}`,
    //     };

    //     const response = await request(app.getHttpServer())
    //         .post(`/match/book/accept`)
    //         .set('Authorization', `Bearer ${accessToken}`)
    //         .send({
    //             date: registerMatchDto.date,
    //             time: registerMatchDto.time,
    //             homeTeamId: registerMatchDto.homeTeamId,
    //             awayTeamId: registerMatchDto.awayTeamId,
    //             fieldId: registerMatchDto.fieldId,
    //             token: registerMatchDto.token,
    //         })
    //         .expect(201);
    //     matchId = response.body.data.matchId;
    // });

    //경기 후 선수 기록 등록
    // it(':matchId/result/:memberId` (POST)', async () => {
    //     const memberResultDto = {
    //         clean_sheet: faker.number.int({ min: 0, max: 10 }),
    //         assists: faker.number.int({ min: 0, max: 10 }),
    //         goals: faker.number.int({ min: 0, max: 5 }),
    //         yellowCards: faker.number.int({ min: 0, max: 3 }),
    //         redCards: faker.number.int({ min: 0, max: 2 }),
    //         substitions: faker.number.int({ min: 0, max: 3 }),
    //         save: faker.number.int({ min: 0, max: 10 }),
    //     };

    //     const response = await request(app.getHttpServer())
    //         .post(`${matchId}/result/${memberId}`)
    //         .set('Authorization', `Bearer ${accessToken}`)
    //         .send({
    //             clean_sheet: memberResultDto.clean_sheet,
    //             assists: memberResultDto.assists,
    //             goals: memberResultDto.goals,
    //             yellowCards: memberResultDto.yellowCards,
    //             redCards: memberResultDto.redCards,
    //             substitions: memberResultDto.substitions,
    //             save: memberResultDto.save,
    //         })
    //         .expect(201);
    // });

     //경기 후 팀 기록 등록

    // "team":{
    //     "substitions": [{"inPlayerId":2,"outPlayerId":1}],
    //     "passes": 150,
    //     "penaltyKick": 0,
    //     "freeKick": 6
    //    },
    //   "results" : [{
    //                 "userId": 1,
    //                 "assists": 3,
    //                 "goals": 1,
    //                 "yellowCards": 1,
    //                 "redCards": 0,
    //                 "save": 0
    //                 },{
    //                 "userId": 2,
    //                 "assists": 3,
    //                 "goals": 1,
    //                 "yellowCards": 1,
    //                 "redCards": 0,
    //                 "save": 0
    //                 }
    //     ]
    
    //  it('/api/match/:metchId/result/member (POST)', async () => {
    //     const memberResultDto = {
    //         clean_sheet: faker.number.int({ min: 0, max: 10 }),
    //         assists: faker.number.int({ min: 0, max: 10 }),
    //         goals: faker.number.int({ min: 0, max: 5 }),
    //         yellowCards: faker.number.int({ min: 0, max: 3 }),
    //         redCards: faker.number.int({ min: 0, max: 2 }),
    //         substitions: faker.number.int({ min: 0, max: 3 }),
    //         save: faker.number.int({ min: 0, max: 10 }),
    //     };

    //     const response = await request(app.getHttpServer())
    //         .post(`/api/match/${matchId}/result/member`)
    //         .set('Authorization', `Bearer ${accessToken}`)
    //         .send({
    //             clean_sheet: memberResultDto.clean_sheet,
    //             assists: memberResultDto.assists,
    //             goals: memberResultDto.goals,
    //             yellowCards: memberResultDto.yellowCards,
    //             redCards: memberResultDto.redCards,
    //             substitions: memberResultDto.substitions,
    //             save: memberResultDto.save,
    //         })
    //         .expect(201);
    // });

    afterAll(async () => {
        await app.close();
    });
});


//시나리오 2 - 아무 소속에 없는 회원 팀에 가입시키기
describe('AppController (e2e) - 시나리오 1: 모든 새로운 팀 회원들이 구단주가 됨', () => {
    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();

        await app.init();
    }, 10000);

    //더미데이터 회원가입
    it('/auth/sign-up (POST)', async () => {
        const signUpDto = {
            passwordConfirm: 'Ex@mp1e!!',
            email: faker.internet.email(),
            password: 'Ex@mp1e!!',
            name: faker.person.fullName(),
        };

        const response = await request(app.getHttpServer())
            .post('/auth/sign-up')
            .send(signUpDto)
            .expect(201);
        accessToken = response.body.data.accessToken;
    });

        //프로필 생성
        it('/profile (POST)', async () => {
            const registerPorfileDto = {
                preferredPosition: getRandomPosition(),
                weight: faker.number.int({ min: 40, max: 100 }),
                height: faker.number.int({ min: 150, max: 190 }),
                age: faker.number.int({ min: 18, max: 50 }),
                gender: 'Male',
            };
    
            const response = await request(app.getHttpServer())
                .post('/profile')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(registerPorfileDto)
                .expect(201);
        });

    afterAll(async () => {
        await app.close();
    });
});

//시나리오 3 - 아무 소속에 없는 회원 팀에 가입시키기
//     describe('AppController (e2e) - 시나리오 2: 아무 소속에 없는 회원 팀에 가입시키기', () => {
//     beforeAll(async () => {
//         const moduleFixture: TestingModule = await Test.createTestingModule({
//             imports: [AppModule],
//         }).compile();

//         app = moduleFixture.createNestApplication();

//         await app.init();
//     });

//     //더미데이터 회원가입2
//     it('/auth/sign-up (POST)', async () => {
//         const signUpDto = {
//             passwordConfirm: 'Ex@mp1e!!',
//             email: faker.internet.email(),
//             password: 'Ex@mp1e!!',
//             name: faker.person.fullName(),
//         };

//         const response = await request(app.getHttpServer())
//             .post('/auth/sign-up')
//             .send(signUpDto)
//             .expect(201);
//         console.log(response.body);
//         accessToken = response.body.data.accessToken;
//         userId = response.body.data.id;
//     });

//     //프로필 생성2
//     it('/profile (POST)', async () => {
//         const registerPorfileDto = {
//              preferredPosition: getRandomPosition(),
//             weight: faker.number.int,
//             height: faker.number.int,
//             age: faker.number.int,
//             gender: 'Male',
//         };

//         const response = await request(app.getHttpServer())
//             .post('/profile')
//             .set('Authorization', `Bearer ${accessToken}`)
//             .send(registerPorfileDto)
//             .expect(201);
//     });
//     //멤버 생성
//     it('/team/{teamId}/user/{userId} (POST)', async () => {
//         //팀 아이디는 마지막 팀 아이디가 되는건가?
//         //유저아이디는 회원가입한 유저 -> 실패! 유저가 스태프여야하는데 스태프가 되려면 팀을 만들어야함
//         const response = await request(app.getHttpServer())
//             .post(`/team/${teamId}/user/${userId}`)
//             .set('Authorization', `Bearer ${accessToken}`)
//             .send()
//             .expect(201);
//     });

//     afterAll(async () => {
//         await app.close();
//     });
// });
