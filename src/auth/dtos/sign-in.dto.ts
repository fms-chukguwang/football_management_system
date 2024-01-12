import { PickType } from '@nestjs/swagger';
import { User } from '../../user/entities/user.entity';

export class SignInDto extends PickType(User, ['email', 'password']) {}
