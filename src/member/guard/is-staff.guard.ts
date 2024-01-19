import {
    BadRequestException,
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { MemberService } from '../member.service';

@Injectable()
export class IsStaffGuard implements CanActivate {
    constructor(private readonly memberService: MemberService) {}
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest();
        const { teamId } = req.params;
        const { id: userId } = req.user;
        const member = await this.memberService.findMemberForUserId(userId);

        if (!member) {
            throw new BadRequestException('해당 인원은 팀에 속해있지 않습니다.');
        }

        if (+teamId !== member.team.id) {
            throw new BadRequestException('자신이 속한 팀에서만 해당 기능을 사용할수 있습니다.');
        }

        if (!member.isStaff) {
            throw new UnauthorizedException('팀 스태프만 해당 기능을 사용할수 있습니다.');
        }

        return true;
    }
}
