import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { faker } from '@faker-js/faker';
import { SignUpDto } from '../../src/auth/dtos/sign-up.dto';
import { SignInDto } from 'src/auth/dtos/sign-in.dto';
import { RegisterProfileInfoDto } from 'src/profile/dtos/register-profile-info-dto';
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


function getRandomPosition(): Position {
    const positions = Object.values(Position);
    const randomIndex = Math.floor(Math.random() * positions.length);
    return positions[randomIndex];
}

let accessToken1: string;
let responseTimes: number[] = []; 
let app: INestApplication;


//시나리오 1 - 팀 1 구단주
describe('AppController (e2e) - 시나리오 1: 팀 1구단주', () => {
    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();

        await app.init();
    }, 600000);

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
            gender: 'Male',
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
            
    });
    // it('/profile (GET)', async () => {
    //     for (let i = 0; i < 1000; i++) {
    //         // 요청 전 시간 기록
    //         const startTime = Date.now();
    //         const response = await request(app.getHttpServer())
    //             .get('/profile')
    //             .set('Authorization', `Bearer ${accessToken1}`)
    //             .expect(200);
    //         // 요청 후 시간 기록
    //         const endTime = Date.now();
    //         // 응답 시간 계산
    //         const responseTime = endTime - startTime;
    //         // 응답 시간을 배열에 추가
    //         responseTimes.push(responseTime);
    //     }
    // }, 60000 * 10); // 테스트 타임아웃 10분
    

    // afterAll(async () => {
    //     await app.close();
    
    //     if (responseTimes.length > 0) {
    //       const sum = responseTimes.reduce((acc, curr) => acc + curr, 0);
    //       const average = sum / responseTimes.length;
    
    //       console.log('응답 시간의 평균:', average);
    //     } else {
    //       console.log('평균값을 계산할 유효한 응답이 없습니다.');
    //     }
    //   });

      afterAll(async () => {
        await app.close();
    });
});

