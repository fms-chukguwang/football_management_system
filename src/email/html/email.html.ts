import { SendJoiningEmailDto } from 'src/member/dtos/send-joining-email.dto';
import { TeamModel } from 'src/team/entities/team.entity';
import { User } from 'src/user/entities/user.entity';

export const joinTeamHtml = (from: SendJoiningEmailDto, recipient: TeamModel, token: string) => {
    return `
    <p>안녕하세요, ${recipient.creator.name} 님</p>
    <p>${from.name} 회원님이 ${recipient.name} 구단에 입단 신청을 했습니다.</p>
    <p>수락하시겠습니까?</p>

    <form action="http://localhost:${
        process.env.SERVER_PORT || 3000
    }/api/team/${recipient.id}/user/${from.id}/approve" method="POST">
    <input type="hidden" name="token" value="${token}">
    <button style="background-color: #4CAF50; color: white; padding: 10px 20px; text-align: center; text-decoration: none; display: inline-block; border-radius: 5px; cursor: pointer;">수락</button>
    </form>

    <form action=http://localhost:${
        process.env.SERVER_PORT || 3000
    }/api/team/${recipient.id}/user/${from.id}/reject" method="POST">
    <input type="hidden" name="token" value="${token}">
    <button style="background-color: #4CAF50; color: white; padding: 10px 20px; text-align: center; text-decoration: none; display: inline-block; border-radius: 5px; cursor: pointer;">거절</button>
    </form>
  `;
};

export const rejectTeamHtml = (temaName: string, user: User) => {
    return `
    <p>안녕하세요, ${user.name} 님</p>
    <p>${user.name} 회원님이 신청하신 ${temaName}구단에 입단 신청이 거절되었습니다.</p>
    `;
};
