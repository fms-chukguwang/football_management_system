import { DataSource } from 'typeorm';
import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { Profile } from 'src/profile/entities/profile.entity';
import { User } from 'src/user/entities/user.entity';
import { LocationModel } from 'src/location/entities/location.entity';

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
