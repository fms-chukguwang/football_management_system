import { INestApplication } from '@nestjs/common'; // NestJS에서 애플리케이션의 인터페이스를 의미 이를 통해 NestJS 애플리케이션의 생명주기를 관리할 수 있음
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module'; // AppModule은 애플리케이션의 루트 모듈을 의미. NestJS 애플리케이션은 모듈로 구성되며, AppModule은 이러한 모듈의 진입점
import { faker } from '@faker-js/faker'; // faker-js/faker 패키지에서 faker 객체를 가져옵니다. 이 객체는 테스트 데이터를 생성하는 데 사용됩니다.
import * as request from 'supertest'; // supertest 패키지에서 request 객체를 가져옵니다. 이 객체는 HTTP 요청을 보내는 데 사용됩니다.

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

enum Gender {
    Male = 'Male',
    Female = 'Female',
}

function getRandomGender(): Gender {
    const gender = Object.values(Gender);
    const randomIndex = Math.floor(Math.random() * gender.length);
    return gender[randomIndex];
}

function getRandomPosition(): Position {
    const positions = Object.values(Position);
    const randomIndex = Math.floor(Math.random() * positions.length);
    return positions[randomIndex];
}

let app: INestApplication; // app 변수를 선언하여 INestApplication 인터페이스의 인스턴스를 나타냅니다. 이 변수는 나중에 애플리케이션의 인스턴스를 저장하는 데 사용됩니다.
let accessToken1: string; // accessToken1 변수를 선언하여 문자열을 나타냅니다. 이 변수는 나중에 사용자 1의 액세스 토큰을 저장하는 데 사용됩니다.
let teamId1: number; // teamId1 변수를 선언하여 숫자를 나타냅니다. 이 변수는 나중에 팀 1의 ID를 저장하는 데 사용됩니다.

// 시나리오 1 - 팀 1 구단주
describe('AppController (e2e) - 시나리오 1: 팀 1 구단주', () => {
    //  describe 함수는 Jest에서 제공하는 함수로, 테스트 스위트를 정의합니다. 여기서는 "AppController (e2e) - 시나리오 1: 팀 1 구단주"라는 이름의 테스트 그룹을 생성합니다.
    beforeAll(async () => {
        // beforeAll은 테스트 스위트에서 모든 테스트가 실행되기 전에 한 번만 실행되는 훅입니다. 여기서 비동기 설정을 초기화하는 로직을 수행합니다.
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();
        // 테스트 모듈을 생성합니다. AppModule을 import하여 테스트 환경에서 전체 애플리케이션의 모듈 구조를 재현합니다. compile 메서드를 호출하여 모듈을 컴파일합니다. await 키워드는 비동기 작업이 완료될 때까지 기다립니다.

        app = moduleFixture.createNestApplication();
        // createNestApplication 메서드를 사용하여 컴파일된 테스트 모듈로부터 NestJS 애플리케이션의 인스턴스를 생성하고 app 변수에 할당합니다.

        await app.init();
        // app.init()을 호출하여 애플리케이션을 초기화합니다. 이는 애플리케이션이 실행될 준비가 되었음을 의미하며, 모든 모듈이 로드되고 서비스가 시작됩니다. 마지막으로 beforeAll 블록이 종료되고, 이제 테스트 케이스를 실행할 준비가 되었습니다.
    }, 10000);
    // Jest는 기본적으로 5초의 Timeout(아무것도 설정하지 않은 경우). 이를 10초로 늘려줍니다.

    it('/auth/sign-up (POST)', async () => {
        // it 함수는 Jest에서 개별 테스트 케이스를 정의하는 데 사용됩니다. 여기서는 '/auth/sign-up (POST)'라는 이름으로 테스트 케이스를 정의하고 있으며, 이는 /auth/sign-up 경로에 대한 POST 요청을 테스트할 것임을 나타냅니다. async 키워드는 이 함수가 비동기 작업을 포함하고 있음을 의미합니다.

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
        // 이 부분은 실제 HTTP 요청을 NestJS 애플리케이션에 보내는 코드입니다.
        // request(app.getHttpServer())는 애플리케이션의 HTTP 서버에 요청을 보내기 위한 설정을 시작합니다.
        // .post('/auth/sign-up')은 /auth/sign-up 경로에 POST 요청을 보냅니다.
        // .send(signUpDto)는 signUpDto 객체를 요청 본문(body)으로 전송합니다.
        // .expect(201)은 요청에 대한 응답 코드가 201(생성됨)이어야 함을 나타내는 부분입니다.
        // await 키워드는 비동기 요청이 완료될 때까지 기다립니다.

        accessToken1 = response.body.data.accessToken;
    }, 30000);

    // 프로필 생성
    it('/profile (POST)', async () => {
        const registerProfileDto = {
            preferredPosition: getRandomPosition(),
            weight: faker.number.int({ min: 40, max: 100 }),
            height: faker.number.int({ min: 150, max: 190 }),
            age: faker.number.int({ min: 18, max: 50 }),
            gender: 'Male',
            birthdate: '1992-02-14',
            latitude: '37.9066013985431',
            longitude: '127.723593188549',
            city: '강원특별자치도',
            district: '춘천시',
            address: '강원특별자치도 춘천시 가래매기길 6',
        };
        const response = await request(app.getHttpServer())
            .post('/profile')
            .set('Authorization', `Bearer ${accessToken1}`)
            .field('preferredPosition', registerProfileDto.preferredPosition)
            .field('weight', registerProfileDto.weight)
            .field('height', registerProfileDto.height)
            .field('age', registerProfileDto.age)
            .field('gender', registerProfileDto.gender)
            .field('birthdate', registerProfileDto.birthdate)
            .field('latitude', registerProfileDto.latitude)
            .field('longitude', registerProfileDto.longitude)
            .field('city', registerProfileDto.city)
            .field('district', registerProfileDto.district)
            .field('address', registerProfileDto.address)
            .attach('file', 'src/img/IMG_6407.jpg') // 파일 첨부
            .expect(201);
    });

    // 팀 생성
    it('/team (POST)', async () => {
        const registerTeamDto = {
            name: faker.lorem.words(2),
            description: faker.lorem.text(),
            gender: 'Male',
            isMixedGender: false,
            address: '서울 강남구 가로수길 5',
            state: '서울',
            city: '강남구',
            latitude: 127.023150432187,
            longitude: 37.5182112402056,
            district: '신사동',
        };

        const response = await request(app.getHttpServer())
            .post('/team')
            .set('Authorization', `Bearer ${accessToken1}`)
            .field('name', registerTeamDto.name)
            .field('description', registerTeamDto.description)
            .field('gender', registerTeamDto.gender)
            .field('isMixedGender', registerTeamDto.isMixedGender)
            .field('state', registerTeamDto.state)
            .field('city', registerTeamDto.city)
            .field('district', registerTeamDto.district)
            .field('address', registerTeamDto.address)
            .field('latitude', registerTeamDto.latitude)
            .field('longitude', registerTeamDto.longitude)
            .attach('file', 'src/img/IMG_6407.jpg')
            .expect(201);

        teamId1 = response.body.data.id;
    });
});
