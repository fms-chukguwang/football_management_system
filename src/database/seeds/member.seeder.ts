import { DataSource } from 'typeorm';
import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { Member } from 'src/member/entities/member.entity';
import { Profile } from 'src/profile/entities/profile.entity';
import { TeamModel } from 'src/team/entities/team.entity';

export default class MemberSeeder implements Seeder {
    public async run(dataSource: DataSource, factoryManager: SeederFactoryManager): Promise<void> {
        const profileRepository = dataSource.getRepository(Profile);
        const teamRepository = dataSource.getRepository(TeamModel);
        const memberRepository = dataSource.getRepository(Member);

        const memberFactory = factoryManager.get(Member);
        const profiles = await profileRepository.find({ relations: ['user'] }); // Include the user relation
        const teams = await teamRepository.find();

        for (const team of teams) {
            // Distribute profiles evenly across teams
            const assignedProfiles = profiles.filter(
                (_, index) => index % teams.length === team.id - 1,
            );

            for (const profile of assignedProfiles) {
                const member = await memberFactory.make();
                member.profile = profile;
                member.user = profile.user; // Assign the user from the profile
                member.team = team;
                await memberRepository.save(member);
            }
        }
    }
}
