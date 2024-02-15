import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { faker } from '@faker-js/faker';
import { ProfileService } from './profile.service';
import { AppModule } from '../app.module';

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

describe('ProfileController (e2e)', () => {
    let accessToken1: string;
    let app: INestApplication;
    let profileService: ProfileService;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        profileService = moduleFixture.get<ProfileService>(ProfileService);
    });

    afterAll(async () => {
        await app.close();
    });

    describe('/profile', () => {
        it('/profile (GET) - should get all profiles', async () => {
            const response = await request(app.getHttpServer())
                .get('/profile')
                .expect(HttpStatus.OK);
            expect(response.body.statusCode).toEqual(HttpStatus.OK);
            expect(response.body.message).toEqual('전체 프로필 정보 조회에 성공했습니다.');
        });
    });

    describe('profiles without teams', () => {
        it('/profile/available (GET)', async () => {
            const response = await request(app.getHttpServer())
                .get('/profile/available')
                .expect(HttpStatus.OK);
            expect(response.body.statusCode).toEqual(HttpStatus.OK);
            expect(response.body.message).toEqual('팀 없는 프로필 정보 조회에 성공했습니다.');
        });
    });

    describe('detail profile', () => {
        it('/profile/:profileId (GET)', async () => {
            const response = await request(app.getHttpServer())
                .get('/profile/:profileId')
                .expect(HttpStatus.OK);
            expect(response.body.statusCode).toEqual(HttpStatus.OK);
            expect(response.body.message).toEqual('프로필 정보 조회에 성공했습니다.');
        });
    });

    describe('create a profile', () => {
        it('/profile (POST)', async () => {
            const registerPorfileDto = {
                preferredPosition: getRandomPosition(),
                weight: faker.number.int({ min: 40, max: 100 }),
                height: faker.number.int({ min: 150, max: 190 }),
                birthdate: 'Tue Oct 10 2000 00:00:00 GMT+0900 (Korean Standard Time)',
                age: faker.number.int({ min: 18, max: 50 }),
                gender: 'Male',
                address: '서울 강남구 가로수길 5',
                state: '서울',
                city: '강남구',
                latitude: 127.023150432187,
                longitude: 37.5182112402056,
                district: '신사동',
            };

            const response = await request(app.getHttpServer())
                .post('/profile')
                .set('Authorization', `Bearer ${accessToken1}`)
                .field('preferredPosition', registerPorfileDto.preferredPosition)
                .field('weight', registerPorfileDto.weight)
                .field('height', registerPorfileDto.height)
                .field('birthdate', registerPorfileDto.birthdate)
                .field('age', registerPorfileDto.age)
                .field('gender', registerPorfileDto.gender)
                .field('state', registerPorfileDto.state)
                .field('city', registerPorfileDto.city)
                .field('district', registerPorfileDto.district)
                .field('address', registerPorfileDto.address)
                .field('latitude', registerPorfileDto.latitude)
                .field('longitude', registerPorfileDto.longitude)
                .attach('file', '../../img/IMG_6407.jpg')
                .expect(201);
        });
    });

    describe('modifying profile', () => {
        it('/profile/:profileId (PUT)', async () => {
            const modifyProfileDto = {
                preferredPosition: getRandomPosition(),
                weight: faker.number.int({ min: 40, max: 100 }),
                height: faker.number.int({ min: 150, max: 190 }),
                birthdate: 'Tue Oct 10 2000 00:00:00 GMT+0900 (Korean Standard Time)',
                age: faker.number.int({ min: 18, max: 50 }),
                gender: 'Male',
                address: '서울 강남구 가로수길 5',
                state: '서울',
                city: '강남구',
                latitude: 127.023150432187,
                longitude: 37.5182112402056,
                district: '신사동',
            };

            const response = await request(app.getHttpServer())
                .post('/profile')
                .set('Authorization', `Bearer ${accessToken1}`)
                .field('preferredPosition', modifyProfileDto.preferredPosition)
                .field('weight', modifyProfileDto.weight)
                .field('height', modifyProfileDto.height)
                .field('birthdate', modifyProfileDto.birthdate)
                .field('age', modifyProfileDto.age)
                .field('gender', modifyProfileDto.gender)
                .field('state', modifyProfileDto.state)
                .field('city', modifyProfileDto.city)
                .field('district', modifyProfileDto.district)
                .field('address', modifyProfileDto.address)
                .field('latitude', modifyProfileDto.latitude)
                .field('longitude', modifyProfileDto.longitude)
                .attach('file', '../../img/IMG_6407.jpg')
                .expect(201);
        });
    });
    describe('delete profile', () => {
        it('/profile/:profileId (DELETE)', async () => {
            const response = await request(app.getHttpServer())
                .delete('/profile/:profileId')
                .expect(HttpStatus.OK);
            expect(response.body.statusCode).toEqual(HttpStatus.OK);
            expect(response.body.message).toEqual('프로필 정보 삭제에 성공했습니다.');
        });
    });
});
