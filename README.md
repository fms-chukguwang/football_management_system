![fms-tech-used drawio (2)](https://github.com/fms-chukguwang/football_management_system/assets/39757235/e387ace1-7f0d-4681-9255-8eb840b40186)# 축구왕 - 대용량 트래픽 관리를 위한 Football Management System (FMS) 백엔드 **⚽**
![1 (1)](https://github.com/fms-chukguwang/.github/assets/39757235/88b7bc7f-cf9f-4423-9c57-a98e7ad90e9a)

## 0. 목차

1. [서비스 소개](#1-🏃서비스-소개)
2. [⚙️ 서비스 아케틱처](#2-⚙️-서비스-아키텍쳐)
3. [𓊳 ERD 다이어그램](#3-𓊳-ERD-다이어그램)
4. [⚔️ 기술적 의사결정](#4-⚔️-기술적-의사결정)
5. [🦄 프로젝트 주요 기능](#5-🦄-프로젝트-주요-기능)
6. [💎 기능 소개](#6-💎-기능-소개)
7. [💥 기술적인 도전 과제](#7-💥-기술적인-도전-과제)
8. [⚠️ 트러블 슈팅](#8-⚠️-트러블-슈팅)

## 1. 🏃서비스 소개

축구를 사랑하는 모든 사람들을 위한 축구팀 종합 관리 플랫폼, **축구왕**

지역 기반 축구 커뮤니티 및 팀 관리 플랫폼. 지역 팀 모집, 경기 일정 및 결과 기록, 선수 통계, 소셜 기능, 실시간 업데이트로 축구팀을 효율적으로 관리 하세요!

**Service Link** : https://www.fms-chukguwang.site/

**Notion Link :** [https://www.notion.so/b972006f1c854d748e138ec260b04c84](https://www.notion.so/b972006f1c854d748e138ec260b04c84?pvs=21)        

**프론트** : https://github.com/fms-chukguwang/fms_react

**백엔드** : https://github.com/fms-chukguwang/football_management_system                                      

## 2. ⚙️ 서비스 아키텍쳐

![fms-tech-used drawio (2)](https://github.com/fms-chukguwang/football_management_system/assets/39757235/6cfd31b7-2a48-4ccf-a62d-5ff2b1de71d6)


## 3. 𓊳 ERD 다이어그램

가독성을 위해 간소화한 ERD

![image](https://github.com/HoyeongJeon/security/assets/78394999/cd328130-aa07-4a29-b577-0f95213c39d8)


## 4. ⚔️ 기술적 의사결정

| 사용 기술               | 도입 이유                                                                                                                                                                                                                                                                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Github Actions          | - 지속적인 통합/지속적인 배포 (CI/CD) 구축을 통해 효율적이고 일관된 배포 및 테스트 프로세스를 구현하고자 함.</br> - 수동으로 배포 및 테스트를 진행하다보니 효율성이 떨어짐</br> - GitHub Actions vs Jenkins</br>⇒ 간편한 설정과 GitHub 통합을 중시하여 GitHub Actions로 결정함                                                                                     |
| Redis                   | - 웹소켓 세션 저장소 및 채팅로직 구현을 위한 저장소로 활용</br> ⇒ key-value 저장소로서 빠르고, sorted set 등 유용한 자료구조 제공</br> - 사용자 인증을 위한 access token 임시저장소로 활용- 조회가 잦은 데이터를 위한 캐시로 활용</br> ⇒ 조회가 빠르고, DB삽입을 줄여 block 되는 시간을 줄이기 위함                                                                |
| Jest                    | - 테스트 코드를 위해 Jest와 MOCHA 중 하나 선택</br> ⇒ Jest를 통한 간결하고 빠른 테스트 환경을 구축하여 개발 및 테스트 효율성을 높이고자 함                                                                                                                                                                                                                         |
| Websocket / STOMP       | pub/sub 구조의 채팅 기능에서 구독 기능과 메시지 broadcasting을 간편하게구현할 수 있음                                                                                                                                                                                                                                                                              |
| React                   | 동적이고 반응적인 사용자 인터페이스를 구현하기 위해 선택하여 개발 생산성과 품질 높임                                                                                                                                                                                                                                                                               |
| Vercel                  | 정적 웹사이트 및 웹 애플리케이션의 신속하고 쉬운 배포 및 관리를 위해 선택하여 개발 생산성 향상                                                                                                                                                                                                                                                                     |
| MongoDB                 | 로그를 저장하기 위해 사용함. I/O , 에러를 모두 저장하기 위해 비정형 데이터를 저장하는데 더 뛰어난 NoSQL을 고민함. document based nosql을 고려했음. 여러 NoSQL을 고민했지만, NoSQL에 익숙하지 않았기에, 커뮤니티가 크고 자료가 많은 NoSQL을 원했으며, 조건에 맞는 MongoDB를 사용하게 됨                                                                             |
| S3                      | 정적 자산 (이미지, CSS, JavaScript 등)의 호스팅 및 배포에 활용하여 웹 애플리케이션의 성능을 향상시키고 서버 부하를 줄여서 선택                                                                                                                                                                                                                                     |
| AWS 로드밸런서 (ALB)    | - 병렬적으로 구성된 서버에 요청을 분산해주기 위함 ⇒ 간단하게 구성 가능                                                                                                                                                                                                                                                                                             |
| Route 53                | 도메인 관리 및 트래픽 라우팅에 사용하여 서비스의 가용성과 성능을 향상시키고, 서비스 배포 및 관리를 용이                                                                                                                                                                                                                                                            |
| EC2                     | 서버 호스팅 및 관리에 활용하여 애플리케이션의 확장성과 유연성을 높이고, 인프라 비용을 절감                                                                                                                                                                                                                                                                         |
| AWS Certificate Manager | HTTPS 보안 연결을 위해 SSL/TLS 인증서를 적용하여 데이터의 보안을 강화하고 신뢰성 있는 서비스를 제공                                                                                                                                                                                                                                                                |
| RDS                     | 신속하고 안정적인 데이터베이스 서비스를 구축하여 데이터 관리 z및 확장성을 확보하고, 서비스 가용성을 높임                                                                                                                                                                                                                                                           |
| mySQL                   | 관계형 데이터베이스로서의 기본적인 데이터 저장 및 관리에 사용                                                                                                                                                                                                                                                                                                      |
| Swagger & Postman       | API 개발 및 테스트를 위한 도구로 선택                                                                                                                                                                                                                                                                                                                              |
| TypeScript              | 서버 개발을 위한 언어로 선택. JS와 고민했지만, JS는 런타임에 에러가 발견된다는 단점으로 꺼려짐.TS는 타입을 명시할 수 있고, 정적 타입 검사를 제공하기에 코드를 더 쉽게 이해하고, 오류를 런타임이 아닌 컴파일 시 발견할 수 있다는 장점이 있음. 타입을 통해 동료가 짠 코드를 더 명확히 이해할 수 있다는 점에서도 협업에 더 뛰어날 것이라 생각해 TS를 개발 언어로 선택 |
| NestJS                  | 서버를 구성하기 위한 프레임워크로 선택. Express와 고민했지만, 협업 시 자유도가 높은 Express보단 더 구조화되어 있는 NestJS가 협업에 유리할 것이라 생각해 사용. 추가적으로 프레임워크에서 지원해주는 기능이 많아 개발에 더 용이할 것이라 판단함. TS를 100% 지원하는 프레임워크라는 점도 선택이유 중 하나                                                             |

## 5. 🦄 프로젝트 주요 기능

<details>
<summary>시연 영상</summary>
<div markdown="1">

1. 경기 생성
   ![경기생성 new (1)](https://github.com/fms-chukguwang/.github/assets/39757235/7da7d0b6-4d73-47f9-9c91-86a8119c8111)

2. 경기 수락
   ![경기 수락 new (1)](https://github.com/fms-chukguwang/.github/assets/39757235/9dccfd64-8537-45ab-b8ea-ea200375dd3e)
   
3. 경기 전술 설정
![경기_전술설정_new](https://github.com/fms-chukguwang/.github/assets/39757235/c78a2a13-dd55-42f6-a0cf-642490355a21)


 </div>
 </details>

## 6. 💎 기능 소개

<details>
<summary>기능 소개</summary>
<div markdown="1">

1. 팀 관리 : 구단주가 손쉽게 팀 통계 작성 및 멤버 조회/초대 가능. 선수는 멤버 통계/멤버 조회 가능
   ![image](https://github.com/HoyeongJeon/security/assets/78394999/26e01609-1c1b-447d-8bdd-19f415081172)

2. 선수 및 통계 관리 : 구단주는 선수 기록과 통계를 입력/수정 가능, 선수는 통계 및 개인 기록 확인 가능
   ![image](https://github.com/HoyeongJeon/security/assets/78394999/f2b56d43-29f2-4c88-a239-dd9be486f0f9)

3. 일정 및 전술 관리 : 팀 경기 일정 조회 및 상대팀에게 게임 신청 가능. 전술 관리는 포메이션 설정 가능 및 추천/인기 포메이션, 또한 최다 누적 경고자를 보여줌으로써 구단주가 포메이션 선택할때 도움줌
   ![image](https://github.com/HoyeongJeon/security/assets/78394999/b89cee02-8291-43f1-9bda-94b05e9376ec)

4. 경기 결과 관리 : 경기가 끝난후 구단주들은 결과와 선수 개인 기록 등록 가능. 선수와 구단주 모두 경기 결과/개인 기록 확인 가능
   ![image](https://github.com/HoyeongJeon/security/assets/78394999/3f24e6d2-eed8-4179-bb42-5b1ddb807f5a)

5. 채팅 및 실시간 알림: 같은팀 멤버들끼리 채팅 가능(욕설 필터링) 새로운 멤버가 팀에 합류하면 알림 전송
   ![image](https://github.com/HoyeongJeon/security/assets/78394999/3f03ed2a-4982-41af-916f-d8fb40d8737f)

6. 어드민 페이지 : 어드민(개발자)는 회원과 팀 삭제 가능
   ![image](https://github.com/HoyeongJeon/security/assets/78394999/7c83f930-cf97-44f6-b772-c403f954469a)
   </div>
   </details>

## 7. 💥 기술적인 도전 과제

<details>
<summary>실시간채팅 및 알림을 위한 Socket.io</summary>
<div markdown="1">

-   채팅
    팀을 생성하는 경우 해당 팀에 대한 채팅방도 함께 생성.(팀 : 채팅방 = 1 : 1)

    실시간 채팅은 socket.io를 통해 구현했으며, 채팅 내역 및 멤버는 MySQL에 저장함.

<details>
<summary>채팅 코드</summary>
<div markdown="1">

팀 생성

```TypeScript
// src/team/team.service.ts
async createTeam(createTeamDto: CreateTeamDto, userId: number, file: Express.Multer.File) {
				...

        // 채팅방 생성
        const createChatDto: CreateChatDto = { userIds: [userId] };
        const chat = await this.chatService.createChat(createChatDto);

        const team = await this.teamRepository.save({
            ...createTeamDto,
            imageUUID: imageUUID,
            location: {
                id: findLocation.id,
            },
            creator: { id: userId },
            chat,
        });

				...
    }
```

채팅 전송

```TypeScript
// src/chats/chats.gateway.ts
@UseFilters(WsExceptionFilter)
    @SubscribeMessage('send_message')
    async sendMessage(
        @MessageBody() creatMessagesDto: CreateMessagesDto,
        @ConnectedSocket() socket: Socket,
    ) {
        const chatExists = await this.chatsService.checkIdChatExists(creatMessagesDto.chatId);
        if (!chatExists) {
            throw new WsException({
                statusCode: 404,
                message: `${creatMessagesDto.chatId}번 채팅방은 존재하지 않습니다.`,
            });
        }

        const message = await this.messagesService.createMessage(
            creatMessagesDto,
            socket['userId'],
        );

        socket.to(message.chat.id.toString()).emit('receive_message', {
            id: message.id,
            author: {
                id: message.author.id,
                name: message.author.name,
                email: message.author.email,
            },
            message: message.message,
            createdAt: message.createdAt,
        });
    }
```

</div>
</details>
</br>

-   알림
    팀에 인원이 참가하는 경우 실시간 알림을 전송.
    SSE를 고려했지만, 채팅을 구현하면서 Socket.IO를 사용했기에 Socket.IO를 사용하도록 결정

<details>
<summary>알림 코드</summary>
<div markdown="1">

멤버 초대

```TypeScript
// src/memer/member.service.ts
async registerMember(teamId: number, userId: number): Promise<Member> {
        const user = await this.userService.findOneById(userId);
        const team = await this.teamRepository.findOne({
          where: { id: teamId },
          relations: ['chat'],
        });

	      ...

        const chatId = team.chat.id;
        await this.chatsService.inviteChat(chatId, userId);
        this.chatsGateway.enterTeam(teamId, userId);

        return registerMember;
      }

```

알림 전송

```TypeScript
    @UseFilters(WsExceptionFilter)
    @SubscribeMessage('enter_team')
    async enterTeam(teamId: number, userId: number) {
        const newUser = await this.userService.findOneById(userId);

        this.server.to(teamId.toString()).emit('enter_team', {
            message: `${newUser.name}님이 팀에 들어왔습니다.`,
        });
    }

```

</div>
</details>
</br>

**기술적 성과**

캠프에서 이뤄진 대부분의 학습은 http 프로토콜 위주였다. Socket.IO를 통해 채팅 및 알림을 구현하면서 ws 프로토콜에 대한 이해도 상승

</div>
</details>

<details>
<summary>더미데이터 생성</summary>
<div markdown="1">
프로젝트의 특성 상 다수의 멤버 데이터가 필요했음.

Seed를 통해 다수의 더미데이터를 생성.

<details>
<summary>Seed 코드(User 및 Profile)</summary>
<div markdown="1">

```TypeScript
// src/database/factories/users.factory.ts
import { User } from '../../user/entities/user.entity';
import { setSeederFactory } from 'typeorm-extension';
import { UserRole } from '../../enums/user-role.enum';

export default setSeederFactory(User, (faker) => {
    const user = new User();
    user.email = faker.internet.email();
    user.password = '$2b$10$g8PUcqff9Ybd2N7tuwye4OMoVpLAv9Lz3pCEEplcG.2eK6We3fKbO';
    user.name = faker.person.fullName();
    user.role = UserRole.User;
    user.createdAt = new Date();
    user.updatedAt = new Date();
    user.deletedAt = null;

    return user;
});

// src/database/factories/profile.factory.ts
import { Gender } from '../../enums/gender.enum';
import { Position } from '../../enums/position.enum';
import { Profile } from '../../profile/entities/profile.entity';
import { setSeederFactory } from 'typeorm-extension';

export default setSeederFactory(Profile, (faker) => {
    const profile = new Profile();
    profile.weight = faker.number.int({ min: 50, max: 100 });
    profile.height = faker.number.int({ min: 150, max: 200 });
    profile.skillLevel = faker.number.int({ min: 1, max: 10 });
    profile.preferredPosition = faker.helpers.arrayElement(Object.values(Position));
    profile.imageUUID = '2a9d4d63-0619-4abc-8d9c-c4eba2f227b6';
    profile.age = faker.number.int({ min: 18, max: 40 });
    profile.createdAt = new Date();
    profile.updatedAt = new Date();
    profile.deletedAt = null;
    profile.gender = faker.helpers.arrayElement(Object.values(Gender));
    return profile;
});
```

```TypeScript
// src/database/seeds/profile.seeder.ts
import { DataSource } from 'typeorm';
import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { Profile } from '../../profile/entities/profile.entity';
import { User } from '../../user/entities/user.entity';
import { LocationModel } from '../../location/entities/location.entity';

export default class ProfileSeeder implements Seeder {
    public async run(dataSource: DataSource, factoryManager: SeederFactoryManager): Promise<void> {
        const userRepository = dataSource.getRepository(User);
        const profileRepository = dataSource.getRepository(Profile);
        const locationRepository = dataSource.getRepository(LocationModel);
        const usersFactory = factoryManager.get(User);
        const profilesFactory = factoryManager.get(Profile);
        const locationFactory = factoryManager.get(LocationModel);

        for (let i = 0; i < 100; i++) {
            // User 인스턴스 생성
            const user = await usersFactory.make();
            // User 인스턴스 저장
            await userRepository.save(user);
            const location = await locationFactory.make();
            await locationRepository.save(location);
            // Profile 인스턴스 생성, 이때 user를 참조로 제공
            const profile = await profilesFactory.make();
            profile.user = user; // user 필드에 User 인스턴스 할당
            profile.location = location; // location 필드에 LocationModel 인스턴스 할당
            // Profile 인스턴스 저장
            await profileRepository.save(profile);
        }
    }
}
```

</div>
</details>

</div>
</details>

<details>
<summary>전국 축구장 데이터 ETL 구현</summary>
<div markdown="1">
전국 체육 시설 공공 데이터셋에서 축구장 관련 정보를 추출하여 관계형 데이터베이스 시스템(MySQL)에 적재하는 데이터 통합 작업 수행

![image](https://github.com/HoyeongJeon/security/assets/78394999/4a2a3993-495a-463b-8e9d-93a0c2948522)

**파이썬 기반 데이터 파싱**

빠른 개발과 정확한 데이터 파싱 및 ETL 프로세스를 구현을 위해 파이썬 기반 데이터 처리 작업 진행

**주요 처리과정**

<details>
<summary>CSV 파싱</summary>
<div markdown="1">

공공 데이터 포털에서 제공된 CSV 파일을 분석하여 필수 데이터를 파싱하는 과정 구현

```Python
async def process_csv(connection):
    df = pd.read_csv('KS_WNTY_PUBLIC_PHSTRN_FCLTY_STTUS_202303.csv')
    df = df.astype(str)
    df.fillna('', inplace=True)
```

</div>
</details>

<details>
<summary>데이터 클렌징</summary>
<div markdown="1">

추출된 축구장 데이터를 정제하여 불필요한 정보를 제거하고 데이터의 품질을 향상

```Python
for _, row in df.iterrows():
    if row['INDUTY_NM'] in ['축구장']:
        address = row['RDNMADR_NM'] or ''
        state = row['ROAD_NM_CTPRVN_NM']
        city = row['ROAD_NM_SIGNGU_NM']
        district = row['ROAD_NM_EMD_NM'] or ''
        location_id = await address_exists(connection, address)
```

</div>
</details>

<details>
<summary>스키마 매핑</summary>
<div markdown="1">

정제된 데이터를 MySQL 데이터베이스 스키마에 맞게 매핑

```Python
  if not location_id and all([state, city, district, address]):
      location_id = await insert_location(connection, state, city, district, address)
      field_data = {
          'field_name': row['FCLTY_NM'],
          'district': district,
          'phone_number': row['RSPNSBLTY_TEL_NO'],
          'x_coord': row['FCLTY_LO'],
          'y_coord': row['FCLTY_LA']
      }
```

</div>
</details>

<details>
<summary>데이터베이스 적재</summary>
<div markdown="1">

매핑된 데이터를 MySQL 테이블에 저장하는 ETL(Extract, Transform, Load) 프로세스 완성

```Python
async def insert_soccer_field(connection, location_id, field_data):
    cursor = connection.cursor()
    insert_query = """
        INSERT INTO soccer_fields (location_id, field_name, image_url, district, phone_number, x_coord, y_coord)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """
    cursor.execute(insert_query, (
        location_id,
        field_data['field_name'],
        "https://yeyak.seoul.go.kr/web/common/file/FileDown.do?file_id=1702356023799DIAJPN2PPGRAFU1PCEPS1FBSQ",
        field_data['district'],
        field_data['phone_number'],
        field_data['x_coord'],
        field_data['y_coord']
    ))
    connection.commit()
    cursor.close()
```

</div>
</details>

**기술적 성과**

데이터 웨어하우스에 대한 깊은 이해와 SQL 데이터 모델링 기술을 활용하여, 고품질의 데이터 자원을 체계적으로 관리할 수 있는 기반을 마련

</div>
</details>

<details>
<summary>테스트 커버리지 50% 이상 (필수 기능 70% 이상)</summary>
<div markdown="1">

문제점

-   시스템의 신규 기능 출시와 기존 기능의 유지보수 과정에서 **버그가 반복적으로 발생**. 이로 인해 **사용자 경험이 저하 우려와 시스템의 안정성에 대한 필요성 요구**

해결

-   **테스트 도구(Jest)** 를 도입하여 코드베이스의 **테스트 누락 영역을 식별** 하고, 배포 전 오류를 발견해 **전체적인 소프트웨어 품질 향상**

현상황 : 필수 기능 테스트 완료

(formation, location, match, message, redis, soccerfield, statistic, team, tournament, user, auth, profile, member)

![image](https://github.com/HoyeongJeon/security/assets/78394999/418c0000-f756-4d06-8d01-ca4a4c1ab232)

</div>
</details>

## 8. ⚠️ 트러블 슈팅

<details>
<summary>대용량 트래픽 관리</summary>
<div markdown="1">

문제점 : 대용량 트래픽 대응을 위해 스트레스 테스트 진행도중, 가장 트래픽 증가가 우려되고 데이터 연산이 많은 팀 상세조회 화면을 조회할때 서버 수용량 문제와 속도 저하 문제가 발생

1. AWS EC2 t2.micro에서 30초동안(초당 10번의 요청) 300명의 가상 이용자가 서비스를 이용할때 70~80%가 실패
   ![image](https://github.com/HoyeongJeon/security/assets/78394999/2e61918d-b3ea-40cc-a9a0-8f4814e16be7)
   테스트 툴: artillery

![image](https://github.com/HoyeongJeon/security/assets/78394999/20b88c10-33d7-4935-abf0-bae433884c81)
해결방안 :

<details>
<summary>대응 방안 종류</summary>
<div markdown="1">

1. **스케일업 (Scale-up)**:
    - 단일 서버의 성능을 향상시키는 방법으로, 더 강력한 하드웨어로 업그레이드하거나 CPU, RAM 등의 리소스를 추가하는 것입니다. 이 방법은 비교적 간단하지만, 한계에 도달하면 확장성이 부족할 수 있음.
2. **캐싱 (Caching)**:
    - 자주 요청되는 데이터나 쿼리 결과를 메모리나 디스크에 저장하여 반복적인 요청에 대한 응답 시간을 줄입니다. 캐싱은 서버 부하를 줄이고 응답 시간을 개선하는 데 도움이 됨.
3. **CDN (Content Delivery Network)**:
    - CDN은 전 세계에 분산된 서버 네트워크를 사용하여 정적 콘텐츠를 제공하는 방법. 이를 통해 웹 애플리케이션의 응답 시간을 단축하고 대역폭을 줄일 수 있음.
4. **비동기 처리 (Asynchronous Processing)**:
    - 일부 작업을 비동기적으로 처리하여 사용자에게 즉각적인 응답을 제공하고, 뒤늦게 결과를 처리하는 방법. 이를 통해 웹 서버가 트래픽 폭증에도 유연하게 대응할 수 있음.
5. **스케일아웃 (Scale-out)**:
    - 서버 인스턴스의 수를 증가시키는 방법으로, 여러 서버를 추가하여 트래픽을 분산함. 이 방법은 클라우드 서비스를 활용하여 쉽게 구현할 수 있으며, 오토스케일링과 함께 사용될 수 있음.

</div>
</details>

<details>
<summary>스케일아웃, 오토스케일링을 고른 이유</summary>
<div markdown="1">

스케일아웃은 서버 인스턴스의 수를 증가시켜 트래픽을 분산하는 방법이며, 이는 클라우드 서비스를 통해 자동으로 처리될 수 있음.

오토스케일링은 특정 지표나 정책에 따라 서버 인스턴스의 수를 자동으로 늘리거나 줄이는 것을 의미함. 예를 들어, 서버의 CPU 사용률이 일정 수준을 넘어서면 새로운 서버 인스턴스를 자동으로 추가하거나, 트래픽이 감소하면 불필요한 서버 인스턴스를 자동으로 제거할 수 있음.

따라서 오토스케일링은 트래픽 변동에 신속하게 대응하고, 서버 인스턴스의 수를 유동적으로 관리하여 확장성과 가용성을 향상시킬 수 있는 수평 스케일아웃의 한 형태로 볼 수 있음.

1. **트래픽 변동성 관리**: 우리 서비스는 트래픽이 시간에 따라 변동성이 큼. 예를 들어, 특정 이벤트(토너먼트 신청이 한 특정 시간에 열림)이나 프로모션 기간에는 트래픽이 급증할 수 있음. 오토스케일링을 통해 트래픽의 증가에 자동으로 대응하여 사용자에게 지속적인 서비스를 제공할 수 있음.
2. **비용 효율성**: 수동으로 서버 용량을 조절하거나 고정된 용량을 유지하는 것은 비용이 높을 수 있음. 오토스케일링을 사용하면 트래픽에 따라 필요한 만큼의 서버 인스턴스를 동적으로 관리함으로써 비용을 절감할 수 있음.
3. **가용성 향상**: 오토스케일링을 통해 서버 인스턴스의 수를 자동으로 조절함으로써 서비스의 가용성을 향상시킬 수 있음. 트래픽 증가나 하드웨어 장애로 인해 발생할 수 있는 서비스 중단을 최소화할 수 있음.
4. **운영 간소화**: 오토스케일링을 설정하면 서버 용량을 자동으로 관리하기 때문에 운영 및 관리 작업이 간소화됨. 이는 운영 팀의 업무 부담을 줄이고 시간을 절약할 수 있음.
5. **유연성과 확장성**: 오토스케일링을 통해 서버 인스턴스의 수를 동적으로 조절함으로써 시스템의 유연성과 확장성을 확보할 수 있음. 트래픽이 증가하거나 감소할 때 시스템을 쉽게 조정할 수 있음.

이러한 이유로 오토스케일링은 우리 서비스를 효율적으로 운영하고, 사용자에게 높은 가용성과 성능을 제공하는 데 필수적인 도구로 선택됨.

</div>
</details>

결과: 서버 증설로 인하여 서버 수용량이 5배정도 상승함 60초동안 1500명의 가상 사용자들은 100% 성공하였고 1800명이 이용해도 90% 성공률을 기록

![image](https://github.com/HoyeongJeon/security/assets/78394999/20e1917e-85c0-41ad-be2e-01a1f78dbeb6)

</div>
</details>

<details>
<summary>데이터베이스 성능 최적화 (인덱싱)</summary>
<div markdown="1">

문제점: 멤버 검색 할때 속도가 느림

해결방안: 인덱스를 써서 속도를 빠르게함

<details>
<summary>인덱스를 고른 이유: 엘라스틱서치와 캐싱이 데이터베이스에서 가져올때 시간차이때문에 데이터의 일관성이 떨어지는데, 신뢰성 데이터의 일관성과 신뢰성에 대한 보장 검색 속도를 개선하기 위해 인덱스 사용</summary>
<div markdown="1">

<details>
<summary>데이터 최적화 방법 종류</summary>
<div markdown="1">

1. **엘라스틱서치 (Elasticsearch)**: - 목적: 실시간으로 대용량의 데이터를 검색하고 분석하는 데 사용. 특히 텍스트 데이터나 로그 데이터와 같은 비정형 데이터를 다루는 데 적합. - 장점: - 매우 빠른 검색 및 분석 기능을 제공. - 복잡한 쿼리와 검색 기능을 지원. - 확장성이 뛰어나고 분산형 아키텍처를 갖추고 있어 대규모 데이터에 적합. - 단점: - 특정한 유형의 데이터에 특화되어 있어서 다양한 데이터 유형을 처리하는 데는 적합하지 않을 수 있음. - 데이터의 일관성과 신뢰성에 대한 보장이 상대적으로 낮을 수 있음.</br>

2. **캐싱 (Caching)**: - 목적: 반복적으로 요청되는 데이터나 쿼리 결과를 저장하여 응답 시간을 개선하는 데 사용됨. 주로 읽기 작업이 많은 웹 애플리케이션에서 활용됨. - 장점: - 응답 시간을 줄이고 서버 부하를 감소시킬 수 있음. - 자주 요청되는 데이터에 대한 검색 속도를 향상시킴. - 쉽게 구현 가능하며, 대부분의 웹 프레임워크나 데이터베이스에서 지원됨. - 단점: - 캐시된 데이터의 유효성과 일관성을 유지하기 위한 추가적인 관리가 필요함. - 캐시 메모리의 용량 한계와 적중률에 따라 성능이 달라질 수 있음.</br>

3. **인덱싱 (Indexing)**: - 목적: 데이터베이스에서 검색 속도를 향상시키기 위해 인덱스를 생성하는 데 사용됨. 특히 특정 열을 기반으로 빠른 검색을 지원함. - 장점: - 검색 속도를 향상시켜 사용자에게 빠른 응답을 제공. - 데이터베이스의 성능을 최적화하여 트래픽 증가에 대응할 수 있음. - 데이터의 일관성과 무결성을 유지하면서 검색 속도를 향상시킴. - 단점: - 적절한 인덱스 설계가 필요하며, 잘못된 인덱스 설계는 오히려 성능을 저하시킬 수 있음. - 인덱스를 생성하고 유지하는 데 시간과 자원이 소요될 수 있음.

</div>
</details>

</div>
</details>

## **index-testing 💻**

자주 찾는 데이터 조회시 인덱싱 효율성 평가
만개의 데이터를 만들고, EXPLAIN통해 쿼리비용 계산

## 결과 📊

결과값 JSON은 MySQL의 쿼리 실행 계획을 나타냄. 쿼리는 "members" 테이블에 접근하고 있으며 "team_id"를 키로 사용하여 조회하고 있음. 키는 "idx_team_id"에 정의되어 있고, 쿼리 실행에 필요한 비용은 1.05와 9109.05. 쿼리 실행 계획에서 비용이 낮을수록 좋고 성능 최적화를 위해서는 비용을 최소화해야함.

인덱싱을 사용안했을때: 쿼리비용(”9109.05”)
![image](https://github.com/HoyeongJeon/security/assets/78394999/0a856d10-afee-440a-a914-015d48fffff6)
인덱싱을 사용했을때: 쿼리비용(”1.05”)
![image](https://github.com/HoyeongJeon/security/assets/78394999/1968ce5c-1a97-4c36-bb09-1dda51971bd0)

1. "rows_examined_per_scan": 3 - 스캔당 조사된 행 수. 즉, 해당 쿼리에 대해 각 스캔에서 3개의 행이 조사됨
2. "rows_produced_per_join": 3 - 조인 당 생성된 행 수. 즉, 조인 작업에서 각 조인에서 3개의 행이 생성됨.
3. "filtered": "100.00" - 필터링된 행의 비율. 100%이므로 모든 행이 필터링됨.
4. "read_cost": "0.75" - 읽기 비용. 즉, 쿼리 실행 중 데이터를 읽는 데 소요된 비용.
5. "eval_cost": "0.30" - 평가 비용. 즉, 필터 조건 등을 평가하는 데 소요된 비용.
 </div>
 </details>

</div>
</details>

<details>
<summary>API 성능 최적화 (캐싱)</summary>
<div markdown="1">

문제점 : 많은 연산이 있는 API 호출시 속도저하 이슈

해결법 : Redis캐싱을 통해 변화가 없는 데이터는 데이터베이스 조회를 하지않게함

## 개선전**💻**

조회 시에도 초당 요청수를 5로 낮춰서 테스트 했음에도 불구하고 평균 최대 지연시간이 2.5초로 유저 경험을 저해할것으로 우려됨
![image](https://github.com/HoyeongJeon/security/assets/78394999/b6955734-b4c3-4a37-a7cc-230f86669d3b)

![image](https://github.com/HoyeongJeon/security/assets/78394999/8fc52308-fe43-4518-8c87-164e36caf0b0)

## 해결법📊

![image](https://github.com/HoyeongJeon/security/assets/78394999/2ac0b183-0e3a-4264-97a8-a4736c897a71)

1. Redis에서 요청하는 데이터가 존재하는지 확인한다.
2. 확인후 존재하지 않으면 데이터베이스에서 조회를한다.
3. 조회한 데이터를 Redis에 저장한다.
4. 이제 똑같은 요청이 왔을때 Redis 저장된 데이터를 반환

![image](https://github.com/HoyeongJeon/security/assets/78394999/ef107faa-5c13-4ba9-9f38-f697ecf08bb2)

![image](https://github.com/HoyeongJeon/security/assets/78394999/81d99b76-f673-418e-a947-50afa45bcf79)

데이터캐싱을 이용하여 많은 연산이 필요한 데이터의 대한 조회를 최적화 요청수를 더 늘렸음에도 최대 지연시간이 0.5초로 기존보다 많이 개선되어 사용성이 증가

</div>
</details>

<details>
<summary>추천 포메이션</summary>
<div markdown="1">

문제점 : 머신러닝을 도입하여 추천 포메이션 기능을 개발하고자 하였으나, 프로젝트 기한 내에 파이썬과 머신러닝 스킬을 숙달하는 것이 현실적으로 어려움을 겪음

해결점 : 프로젝트의 시간적 제약과 기술적 난이도를 고려하여, 머신러닝 대신 기존의 경기 데이터를 활용한 경험적 분석 방법을 선택

**데이터 기반 의사결정**

팀별 경기결과가 저장된 선수 통계 테이블에서 전체 경기별 팀별 골, 승무패 계산
![image](https://github.com/HoyeongJeon/security/assets/78394999/0461b0f7-8393-4fe7-9b31-01e8d37f15b5)

승률 계산 로직 도입
![image](https://github.com/HoyeongJeon/security/assets/78394999/dea8cb34-6e0d-4b75-835a-dbe26c550f3e)

**추천 시스템의 신속한 구현**

팀별 경기결과 데이터를 가져와 승률 높은 포메이션 선정
![image](https://github.com/HoyeongJeon/security/assets/78394999/6deb0c58-3405-4a3a-af8b-fb29cce028ab)

추천 시스템의 신속한 구현과 함께, 데이터 기반의 신뢰성 있는 결과 제공으로 이용자 만족도를 향상. 이는 비록 고도의 데이터 분석 기법을 적용하지 않았지만, 사용자에게 실질적인 가치를 제공하는 현실적인 해결책을 찾는 데 성공.

<details>
<summary>추후 Item-CF 기반 추천 포메이션 적용</summary>
<div markdown="1">

Item-CF(item-based collaborative filtering) 알고리즘은 아이템 간의 유사도를 기반으로 사용자에게 추천을 제공하는 방식입니다. 이 방법은 사용자의 과거 행동 데이터(예: 경기 결과, 선수 통계)를 분석하여 유사한 아이템(이 경우 포메이션)을 찾아내고, 사용자가 아직 경험하지 않은 아이템을 추천하는 데 사용됩니다.

![image](https://github.com/HoyeongJeon/security/assets/78394999/7e4cbd40-0039-4592-97a1-455cca385f29)

| 아이템 유사도 기반 추천 | 장점                                                                                                 |
| ----------------------- | ---------------------------------------------------------------------------------------------------- |
| 아이템 간 상호작용      | 사용자의 개별적인 경험보다 아이템 간 상호작용에 기반하여 추천, 포메이션 간의 전술적 유사성 파악 가능 |
| 정확한 예측 모델        | 팀별 데이터를 근거로 정교한 포메이션 유사도 계산, 승률 증진 가능성 예측                              |
| 신규 사용자 대응        | 신규 팀/선수 데이터가 추가되어도 기존 포메이션 유사도에 기반한 추천이 가능하여 안정적인 서비스 제공  |
| 스케일러블 시스템       | 아이템(포메이션) 수가 제한적이기 때문에 대규모 데이터셋 처리에 효과적                                |

이와 같이 Item-CF 추천 알고리즘은 기존의 팀 데이터와 경기 결과를 바탕으로 한 경험적 분석에 더해, 더욱 섬세하고 개인화된 추천을 가능하게 하여 최종적으로는 팀 전략의 최적화와 경기력 향상에 기여할것으로 기대

이와 같이 Item-CF 추천 알고리즘은 기존의 팀 데이터와 경기 결과를 바탕으로 한 경험적 분석에 더해, 더욱 섬세하고 개인화된 추천을 가능하게 하여 최종적으로는 팀 전략의 최적화와 경기력 향상에 기여할것으로 기대

</div>
</details>

</div>
</details>
