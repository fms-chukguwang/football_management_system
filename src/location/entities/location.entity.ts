import { IsNumber, IsString } from 'class-validator';
import { BaseModel } from 'src/common/entities/base.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { TeamModel } from '../../team/entities/team.entity';
import { SoccerField } from 'src/match/entities/soccer-field.entity';

@Entity('location')
export class LocationModel extends BaseModel {
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
     * 지역
     * @example "경기"
     */
    @Column()
    state: string;

    /**
     * 도시
     * @example "수원시"
     */
    @Column()
    city: string;

    /**
     * 구
     * @example "권선구"
     */
    @Column()
    district: string;

    /**
     * 주소
     * @example "경기 수원시 권선구"
     */
    @Column()
    address: string;

    @OneToMany(() => TeamModel, (team) => team.location)
    team: TeamModel[];

    @OneToMany(() => SoccerField, (soccerfield) => soccerfield.locationfield)
    soccerfield: SoccerField[];
}
