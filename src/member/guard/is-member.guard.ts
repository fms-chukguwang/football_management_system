import {
    BadRequestException,
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { MemberService } from '../member.service';

@Injectable()
export class IsMemberGuard implements CanActivate {
    constructor(private readonly memberService: MemberService) {}
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest();
        const { teamId, memberId } = req.params;
        const member = await this.memberService.findOneById(memberId);

        if (+teamId !== member.team.id) {
            throw new BadRequestException('자신이 속한 팀에서만 해당 기능을 사용할수 있습니다.');
        }

        req.member = member;

        return true;
    }
}
