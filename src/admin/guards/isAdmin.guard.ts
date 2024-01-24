import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AdminService } from '../admin.service';
import { UserRole } from '../../user/types/user-role.type';
import { UserService } from '../../user/user.service';

@Injectable()
export class IsAdminGuard implements CanActivate {
  constructor(private readonly userService: UserService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const { id: userId } = request.user;
    const user = await this.userService.findOneById(userId);
    // if (user.role !== UserRole.Admin) {
    //   throw new UnauthorizedException('관리자만 접근할 수 있는 페이지입니다.');
    // }
    return true;
  }
}
