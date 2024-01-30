import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { faker } from '@faker-js/faker';
import { SignUpDto } from '../src/auth/dtos/sign-up.dto';
import { SignInDto } from 'src/auth/dtos/sign-in.dto';
import { RegisterProfileInfoDto } from 'src/profile/dtos/register-profile-info';
import { CannotGetEntityManagerNotConnectedError } from 'typeorm';

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

enum Gender {
    male = 'Male',
    female = 'Female',
}

function getRandomGender(): Gender {
    const gender = Object.values(Gender);
    const randomIndex = Math.floor(Math.random() * gender.length);
    return gender[randomIndex];
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

let accessToken1: string;
let accessToken2: string;
let accessToken3: string;
let accessToken4: string;
let accessToken5: string;
let accessToken6: string;
let app: INestApplication;
let signUpDto: SignUpDto;
let teamId1: number;
let teamId2: number;
let teamId3: number;
let teamId4: number;
let userId1: number;
let userId2: number;
let userId3: number;
let userId4: number;
let matchId: number;
let date: string;
let memberId1: number;
let memberId2: number;
let memberId3: number;
let memberId4: number;

//시나리오 1 - 팀 1 구단주 
describe('AppController (e2e) - 시나리오 1: 팀 1구단주', () => {
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
        accessToken1 = response.body.data.accessToken;
    });

    //프로필 생성
    it('/profile (POST)', async () => {
        const registerPorfileDto = {
            preferredPosition: getRandomPosition(),
            weight: faker.number.int({ min: 40, max: 100 }),
            height: faker.number.int({ min: 150, max: 190 }),
            age: faker.number.int({ min: 18, max: 50 }),
            gender: 'male',
        };

        const response = await request(app.getHttpServer())
            .post('/profile')
            .set('Authorization', `Bearer ${accessToken1}`)
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
            .set('Authorization', `Bearer ${accessToken1}`)
            .field('name', registerTeamDto.name)
            .field('description', registerTeamDto.description)
            .field('gender', registerTeamDto.gender)
            .field('isMixedGender', registerTeamDto.isMixedGender)
            .field('postalCode', registerTeamDto.postalCode)
            .field('address', registerTeamDto.address)
            .attach('file', 'src/img/IMG_6407.jpg')
            .expect(201);
        teamId1 = response.body.data.id;
    });

    afterAll(async () => {
        await app.close();
    });
});

//시나리오 2 - 구단주 2
describe('AppController (e2e) - 시나리오 2: 구단주2', () => {
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
        accessToken4 = response.body.data.accessToken;
    });

    //프로필 생성
    it('/profile (POST)', async () => {
        const registerPorfileDto = {
            preferredPosition: getRandomPosition(),
            weight: faker.number.int({ min: 40, max: 100 }),
            height: faker.number.int({ min: 150, max: 190 }),
            age: faker.number.int({ min: 18, max: 50 }),
            gender: 'male',
        };

        const response = await request(app.getHttpServer())
            .post('/profile')
            .set('Authorization', `Bearer ${accessToken4}`)
            .send(registerPorfileDto)
            .expect(201);
    });
    //팀 생성
    it('/team (POST)', async () => {
        //팀을 생성할때 만든 유저는 자동으로 is_staff가 true가 되고 그 팀에 소속됨
        const registerTeamDto = {
            name: faker.lorem.words(2),
            description: faker.lorem.text(),
            gender: 'male',
            isMixedGender: false,
            postalCode: '12344',
            address: '경기도 화성시 향납',
        };

        const response = await request(app.getHttpServer())
            .post('/team')
            .set('Authorization', `Bearer ${accessToken4}`)
            .field('name', registerTeamDto.name)
            .field('description', registerTeamDto.description)
            .field('gender', registerTeamDto.gender)
            .field('isMixedGender', registerTeamDto.isMixedGender)
            .field('postalCode', registerTeamDto.postalCode)
            .field('address', registerTeamDto.address)
            .attach('file', 'src/img/IMG_6407.jpg')
            .expect(201);
        teamId2 = response.body.data.id;
    });

    afterAll(async () => {
        await app.close();
    });
});


//시나리오 3 - 아무 소속에 없는 회원1,2 팀1에 가입시키기
describe('AppController (e2e) - 시나리오 3 - 아무 소속에 없는 회원1,2 팀1에 가입시키기', () => {
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

        accessToken2 = response.body.data.accessToken;
        //userId1 = response.body.data.id;
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
            .set('Authorization', `Bearer ${accessToken2}`)
            .send(registerPorfileDto)
            .expect(201);
   
        userId1 = response.body.data.user.id;
    });

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

        accessToken3 = response.body.data.accessToken;
        //userId1 = response.body.data.id;
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
            .set('Authorization', `Bearer ${accessToken3}`)
            .send(registerPorfileDto)
            .expect(201);
   
        userId2 = response.body.data.user.id;
    });

        //멤버1를 팀1에 추가
        it('/team/:teamId/user/:userId (POST)', async () => {
            const registerMemberDto = {
                // preferredPosition: getRandomPosition(),
                // weight: faker.number.int({ min: 40, max: 100 }),
                // height: faker.number.int({ min: 150, max: 190 }),
                // age: faker.number.int({ min: 18, max: 50 }),
                // gender: 'Male',
            };
    
            const response = await request(app.getHttpServer())
                .post(`/team/${teamId1}/user/${userId1}`)
                .set('Authorization', `Bearer ${accessToken1}`)
             //   .send(registerMemberDto)
                .expect(201);
    
            memberId1 = response.body.data.id;
        });

    //멤버2를 팀1에 추가
    it('/team/:teamId/user/:userId (POST)', async () => {
        const registerMemberDto = {
            // preferredPosition: getRandomPosition(),
            // weight: faker.number.int({ min: 40, max: 100 }),
            // height: faker.number.int({ min: 150, max: 190 }),
            // age: faker.number.int({ min: 18, max: 50 }),
            // gender: 'Male',
        };

        const response = await request(app.getHttpServer())
            .post(`/team/${teamId1}/user/${userId2}`)
            .set('Authorization', `Bearer ${accessToken1}`)
          //  .send(registerMemberDto)
            .expect(201);

        memberId2 = response.body.data.id;
    });
    afterAll(async () => {
        await app.close();
    });
});

//시나리오 4 - 아무 소속에 없는 회원1,2 팀2에 가입시키기
describe('AppController (e2e) - 시나리오 4 - 아무 소속에 없는 회원1,2 팀2에 가입시키기', () => {
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

        accessToken5 = response.body.data.accessToken;
        //userId1 = response.body.data.id;
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
            .set('Authorization', `Bearer ${accessToken5}`)
            .send(registerPorfileDto)
            .expect(201);
   
        userId3 = response.body.data.user.id;
    });


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

    accessToken6 = response.body.data.accessToken;
    //userId1 = response.body.data.id;
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
        .set('Authorization', `Bearer ${accessToken6}`)
        .send(registerPorfileDto)
        .expect(201);

    userId4 = response.body.data.user.id;
});

    //멤버3을 팀2에 추가
    it('/team/:teamId/user/:userId (POST)', async () => {
        const registerMemberDto = {
            // preferredPosition: getRandomPosition(),
            // weight: faker.number.int({ min: 40, max: 100 }),
            // height: faker.number.int({ min: 150, max: 190 }),
            // age: faker.number.int({ min: 18, max: 50 }),
            // gender: 'Male',
        };

        const response = await request(app.getHttpServer())
            .post(`/team/${teamId2}/user/${userId3}`)
            .set('Authorization', `Bearer ${accessToken4}`)
          //  .send(registerMemberDto)
            .expect(201);

        memberId3 = response.body.data.id;
    });

//멤버4를 팀2에 추가
it('/team/:teamId/user/:userId (POST)', async () => {
    const registerMemberDto = {
        // preferredPosition: getRandomPosition(),
        // weight: faker.number.int({ min: 40, max: 100 }),
        // height: faker.number.int({ min: 150, max: 190 }),
        // age: faker.number.int({ min: 18, max: 50 }),
        // gender: 'Male',
    };

    const response = await request(app.getHttpServer())
        .post(`/team/${teamId2}/user/${userId4}`)
        .set('Authorization', `Bearer ${accessToken4}`)
        //.send(registerMemberDto)
        .expect(201);
    memberId4 = response.body.data.id;
});
    afterAll(async () => {
        await app.close();
    });
});

//시나리오 4 - 아무 소속에 없는 회원 팀2 에 가입시키기
describe('AppController (e2e) - 시나리오 4 - 아무 소속에 없는 회원 팀2 에 가입시키기', () => {
    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();

        await app.init();
    }, 10000);

   

    // 경기 생성
    it('/match/book/accept (POST)', async () => {
        const randomDate = faker.date.between(
            '2024-01-26T00:00:00.000Z',
            '2024-02-28T00:00:00.000Z',
        );

        // ISO 8601 형식으로 날짜를 문자열로 변환
        const isoDateString = randomDate.toISOString();

        // 날짜 부분만 추출 (YYYY-MM-DD)
        const onlyDate = isoDateString.split('T')[0];

        const registerMatchDto = {
            date: onlyDate,
            time: getRandomTime(),
            homeTeamId: teamId1,
            awayTeamId: teamId2,
            fieldId: faker.number.int({ min: 1, max: 15 }),
            token: `${accessToken4}`,
        };

        const response = await request(app.getHttpServer())
            .post(`/match/book/accept`)
            .set('Authorization', `Bearer ${accessToken4}`)
            .send({
                date: registerMatchDto.date,
                time: registerMatchDto.time,
                homeTeamId: registerMatchDto.homeTeamId,
                awayTeamId: registerMatchDto.awayTeamId,
                fieldId: registerMatchDto.fieldId,
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

//시나리오 5 - 경기 평가하기
describe('AppController (e2e) - 시나리오 4 - 아무 소속에 없는 회원 팀2 에 가입시키기', () => {
    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();

        await app.init();
    }, 10000);

   
    //경기 후 팀1 기록 등록
    it('/match/:metchId/result (POST)', async () => {
        const teamResultDto = {
            cornerKick: faker.number.int({ min: 0, max: 10 }),
            substitions: [{ inPlayerId: `${memberId1}`, outPlayerId: `${memberId2}` }],
            passes: faker.number.int({ min: 0, max: 100 }),
            penaltyKick: faker.number.int({ min: 0, max: 10 }),
            freeKick: faker.number.int({ min: 0, max: 10 }),
        };

        const response = await request(app.getHttpServer())
            .post(`/match/${matchId}/result`)
            .set('Authorization', `Bearer ${accessToken1}`)
            .send({
                cornerKick: teamResultDto.cornerKick,
                substitions: teamResultDto.substitions,
                passes: teamResultDto.passes,
                penaltykICK: teamResultDto.penaltyKick,
                freeKick: teamResultDto.freeKick,
            })
            .expect(201);
        console.log('match team result', response.body);
    });

        //경기 후 팀2 기록 등록
        it('/match/:metchId/result (POST)', async () => {
            const teamResultDto = {
                cornerKick: faker.number.int({ min: 0, max: 10 }),
                substitions: [{ inPlayerId: `${memberId3}`, outPlayerId: `${memberId4}` }],
                passes: faker.number.int({ min: 0, max: 100 }),
                penaltyKick: faker.number.int({ min: 0, max: 10 }),
                freeKick: faker.number.int({ min: 0, max: 10 }),
            };
    
            const response = await request(app.getHttpServer())
                .post(`/match/${matchId}/result`)
                .set('Authorization', `Bearer ${accessToken4}`)
                .send({
                    cornerKick: teamResultDto.cornerKick,
                    substitions: teamResultDto.substitions,
                    passes: teamResultDto.passes,
                    penaltykICK: teamResultDto.penaltyKick,
                    freeKick: teamResultDto.freeKick,
                })
                .expect(201);
            console.log('match team result', response.body);
        });

    //경기 결과 등록 팀1 멤버1 전체 저장
    it('/match/:matchId/result/member` (POST)', async () => {
        const allMemberResultDto = {
            results: [
                {
                    memberId: `${memberId1}`,
                    assists: faker.number.int({ min: 0, max: 10 }),
                    goals: faker.number.int({ min: 0, max: 10 }),
                    yellowCards: faker.number.int({ min: 0, max: 3 }),
                    redCards: faker.number.int({ min: 0, max: 2 }),
                    save: faker.number.int({ min: 0, max: 10 }),
                },
            ],
        };

        const response = await request(app.getHttpServer())
            .post(`/match/${matchId}/result/member`)
            .set('Authorization', `Bearer ${accessToken1}`)
            .send({
                results: allMemberResultDto.results,
            })
            .expect(201);
            console.log("member result=",response.body);
    });

    //경기 결과 등록 팀1 멤버2 전체 저장
    it('/match/:matchId/result/member` (POST)', async () => {
        const allMemberResultDto = {
            results: [
                {
                    memberId: `${memberId2}`,
                    assists: faker.number.int({ min: 0, max: 10 }),
                    goals: faker.number.int({ min: 0, max: 10 }),
                    yellowCards: faker.number.int({ min: 0, max: 3 }),
                    redCards: faker.number.int({ min: 0, max: 2 }),
                    save: faker.number.int({ min: 0, max: 10 }),
                },
            ],
        };

        const response = await request(app.getHttpServer())
            .post(`/match/${matchId}/result/member`)
            .set('Authorization', `Bearer ${accessToken4}`)
            .send({
                results: allMemberResultDto.results,
            })
            .expect(201);
    });

        //경기 결과 등록 팀2 멤버3 전체 저장
        it('/match/:matchId/result/member` (POST)', async () => {
            const allMemberResultDto = {
                results: [
                    {
                        memberId: `${memberId3}`,
                        assists: faker.number.int({ min: 0, max: 10 }),
                        goals: faker.number.int({ min: 0, max: 10 }),
                        yellowCards: faker.number.int({ min: 0, max: 3 }),
                        redCards: faker.number.int({ min: 0, max: 2 }),
                        save: faker.number.int({ min: 0, max: 10 }),
                    },
                ],
            };
    
            const response = await request(app.getHttpServer())
                .post(`/match/${matchId}/result/member`)
                .set('Authorization', `Bearer ${accessToken4}`)
                .send({
                    results: allMemberResultDto.results,
                })
                .expect(201);
                console.log("member result=",response.body);
        });
    
        //경기 결과 등록 팀2 멤버4 전체 저장
        it('/match/:matchId/result/member` (POST)', async () => {
            const allMemberResultDto = {
                results: [
                    {
                        memberId: `${memberId4}`,
                        assists: faker.number.int({ min: 0, max: 10 }),
                        goals: faker.number.int({ min: 0, max: 10 }),
                        yellowCards: faker.number.int({ min: 0, max: 3 }),
                        redCards: faker.number.int({ min: 0, max: 2 }),
                        save: faker.number.int({ min: 0, max: 10 }),
                    },
                ],
            };
    
            const response = await request(app.getHttpServer())
                .post(`/match/${matchId}/result/member`)
                .set('Authorization', `Bearer ${accessToken4}`)
                .send({
                    results: allMemberResultDto.results,
                })
                .expect(201);
        });

    //경기 결과 등록 멤버 전체 저장
    //   it('/match/:matchId/result/member` (POST)', async () => {
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

    afterAll(async () => {
        await app.close();
    });
});

