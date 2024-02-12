import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { UserRole } from 'src/enums/user-role.enum';

export default class UsersSeeder implements Seeder {
    public async run(dataSource: DataSource, factoryManager: SeederFactoryManager): Promise<any> {
        // const repository = dataSource.getRepository(User);
        // await repository.insert([
        //     {
        //         email: 'seedTest@test.com',
        //         password: 'Ex@mp1e!!',
        //         name: '싣드테스트',
        //         role: UserRole.User,
        //         createdAt: new Date(),
        //         updatedAt: new Date(),
        //         deletedAt: null,
        //     },
        // ]);
        const usersFactory = factoryManager.get(User);
        await usersFactory.saveMany(100);
    }
}
