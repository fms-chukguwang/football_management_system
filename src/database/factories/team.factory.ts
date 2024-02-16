import { Gender } from '../../enums/gender.enum';
import { TeamModel } from '../../team/entities/team.entity';
import { setSeederFactory } from 'typeorm-extension';

export default setSeederFactory(TeamModel, (faker) => {
    const team = new TeamModel();
    team.name = faker.company.name();
    team.description = faker.company.catchPhrase();
    team.imageUUID = '3dac6d1f-42e1-46e6-838c-8ce1a55c8f95';
    team.isMixedGender = faker.datatype.boolean();
    team.gender = faker.helpers.arrayElement(Object.values(Gender));
    team.createdAt = new Date();
    team.updatedAt = new Date();
    team.deletedAt = null;
    team.totalMembers = 0;
    return team;
});
