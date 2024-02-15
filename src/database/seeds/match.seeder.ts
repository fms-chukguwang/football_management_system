import { Match } from '../../match/entities/match.entity';
import { TeamModel } from '../../team/entities/team.entity';
import { DataSource } from 'typeorm';
import { Seeder, SeederFactoryManager } from 'typeorm-extension';

export default class MatchSeeder implements Seeder {
    public async run(dataSource: DataSource, factoryManager: SeederFactoryManager): Promise<void> {
        const teamRepository = dataSource.getRepository(TeamModel);
        const matchRepository = dataSource.getRepository(Match);
        const matchFactory = factoryManager.get(Match);
        const teams = await teamRepository.find({
            relations: ['creator'],
        });
        console.log('teams', teams);
        for (let i = 1; i < 20; i++) {
            const match = await matchFactory.make();
            console.log('teams[i]=', teams[i]);
            match.owner_id = teams[0].creator.id;
            match.hometeam = teams[0];
            match.home_team_id = teams[0].id;
            match.awayteam = teams[i];
            match.away_team_id = teams[i].id;
            await matchRepository.save(match);
            console.log('matchDone!');
        }
    }
}
