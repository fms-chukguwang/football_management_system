import { MatchResult } from 'src/match/entities/match-result.entity';
import { setSeederFactory } from 'typeorm-extension';

export default setSeederFactory(MatchResult, (faker) => {
    const matchResult = new MatchResult();

    matchResult.clean_sheet = faker.datatype.boolean();
    matchResult.corner_kick = faker.number.int({ min: 0, max: 10 });
    matchResult.free_kick = faker.number.int({ min: 0, max: 10 });
    matchResult.penalty_kick = 0;
    matchResult.passes = faker.number.int({ min: 400, max: 700 });
    matchResult.created_at = new Date();
    matchResult.updated_at = new Date();
    matchResult.deleted_at = null;

    return matchResult;
});
