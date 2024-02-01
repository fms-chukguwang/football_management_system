import { BaseModel } from 'src/common/entities/base.entity';
import { Entity } from 'typeorm';

@Entity()
export class SoccerFieldModel extends BaseModel {
    name: string;
}
