import { PickType } from '@nestjs/swagger';
import { User } from '../../user/entities/user.entity';

export class EmailVerifyDto extends PickType(User, ['email']) {}
