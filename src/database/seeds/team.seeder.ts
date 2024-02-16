import { DataSource } from 'typeorm';
import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { Profile } from '../../profile/entities/profile.entity';
import { User } from '../../user/entities/user.entity';
import { TeamModel } from '../../team/entities/team.entity';
import { Chats } from '../../chats/entities/chats.entity';
import { LocationModel } from '../../location/entities/location.entity';

export default class TeamSeeder implements Seeder {
    public async run(dataSource: DataSource, factoryManager: SeederFactoryManager): Promise<void> {
        const userRepository = dataSource.getRepository(User);
        const teamRepository = dataSource.getRepository(TeamModel);
        const chatRepository = dataSource.getRepository(Chats);
        const profileRepository = dataSource.getRepository(Profile);
        const locationRepository = dataSource.getRepository(LocationModel);
        const usersFactory = factoryManager.get(User);
        const teamFactory = factoryManager.get(TeamModel);
        const chatFactory = factoryManager.get(Chats);
        const profileFactory = factoryManager.get(Profile);

        const users = await userRepository.find({
            relations: ['profile'],
        });
        const location = await locationRepository.find();

        for (let i = 0; i < 20; i++) {
            const team = await teamFactory.make();
            const chat = await chatFactory.make();
            team.creator = users[i]; // user 필드에 User 인스턴스 할당
            team.creator.profile = users[i].profile;
            team.location = location[1];
            await chatRepository.save(chat);
            team.chat = chat;
            await teamRepository.save(team);
        }
    }
}
