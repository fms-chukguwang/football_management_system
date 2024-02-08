import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { BaseModel } from '../../common/entities/base.entity';
import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TeamModel } from '../../team/entities/team.entity';
import { Factory } from 'nestjs-seeder';
import { Profile } from '../../profile/entities/profile.entity';
import { SoccerField } from '../../match/entities/soccer-field.entity';
import { TournamentModel } from 'src/tournament/entities/tournament.entity';

@Entity('location')
export class LocationModel extends BaseModel {
    @PrimaryGeneratedColumn()
    id: number;

    /**
     * 우편 번호
     * @example 16661
     */
    // @Column({
    //     unique: true,
    //     name: 'postal_code',
    // })
    // @IsNumber()
    // postalCode: number;

    /**
     * 위도
     * @example 37.5665
     */

    @Column()
    latitude: number;

    /**
     * 경도
     * @example 126.9780
     */

    @Column()
    longitude: number;

    /**
     * 지역
     * @example "경기"
     */
    @Factory((faker) => faker.location.state())
    @Column()
    state: string;

    /**
     * 도시
     * @example "수원시"
     */
    @Factory((faker) => faker.location.city())
    @Column()
    city: string;

    /**
     * 구
     * @example "권선구"
     */
    @Column()
    @Factory((faker) => faker.location.county())
    district: string;

    // /**
    //  * 동
    //  * @example "권선구"
    //  */
    // @Column()
    // @Factory((faker) => faker.location.county())
    // dong: string;

    /**
     * 주소
     * @example "경기 수원시 권선구"
     */
    @Column()
    @Factory((faker) => faker.location.street())
    address: string;

    @OneToMany(() => TeamModel, (team) => team.location)
    team: TeamModel[];

    @OneToOne(() => Profile, (profile) => profile.location)
    @JoinColumn()
    profile: Profile;

    @OneToMany(() => SoccerField, (soccerfield) => soccerfield.locationfield)
    soccerfield: SoccerField[];

    @OneToOne(() => TournamentModel, (tournament) => tournament.location)
    @JoinColumn()
    tournament: TournamentModel;
}
