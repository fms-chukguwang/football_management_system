import { Match } from 'src/match/entities/match.entity';
import { setSeederFactory } from 'typeorm-extension';

export default setSeederFactory(Match, (faker) => {
    const match = new Match();
    match.created_at = new Date();
    match.updated_at = new Date();
    match.deleted_at = null;
    return match;
});
