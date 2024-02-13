import { Gender } from 'src/enums/gender.enum';
import { TeamModel } from 'src/team/entities/team.entity';
import { setSeederFactory } from 'typeorm-extension';

export default setSeederFactory(TeamModel, (faker) => {
    const team = new TeamModel();
    team.name = faker.company.name();
    team.description = faker.company.catchPhrase();
    team.imageUUID = faker.image.url();
    team.isMixedGender = faker.datatype.boolean();
    team.gender = faker.helpers.arrayElement(Object.values(Gender));
    team.createdAt = new Date();
    team.updatedAt = new Date();
    team.deletedAt = null;
    team.totalMembers = 0;
    return team;
});
