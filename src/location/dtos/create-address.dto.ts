import { PickType } from '@nestjs/swagger';
import { LocationModel } from '../entities/location.entity';

export class CreateAddressDto extends PickType(LocationModel, [
    'state',
    'city',
    'district',
]) {}
