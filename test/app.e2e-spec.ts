import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { faker } from '@faker-js/faker';
import { SignUpDto } from '../src/auth/dtos/sign-up.dto';
import { SignInDto } from 'src/auth/dtos/sign-in.dto';
import { RegisterProfileInfoDto } from 'src/profile/dtos/register-profile-info';

let accessToken: string;
let app: INestApplication;
let signUpDto: SignUpDto;
let teamId:number;
let userId:number;

//시나리오 1 - 모든 새로운 팀 회원들이 구단주가 됨
describe('AppController (e2e) - 시나리오 1: 모든 새로운 팀 회원들이 구단주가 됨', () => {
    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();

        await app.init();
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
        accessToken = response.body.data.accessToken;
    });

    //프로필 생성
    it('/profile (POST)', async () => {
        const registerPorfileDto = {
            preferredPosition: 'Center Back',
            weight: faker.number.int,
            height: faker.number.int,
            age: faker.number.int,
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
            teamId = response.body.data.id;
    });
    afterAll(async () => {
        await app.close();
    });
});

    //시나리오 2 - 아무 소속에 없는 회원 팀에 가입시키기
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
//             preferredPosition: 'Center Back',
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
