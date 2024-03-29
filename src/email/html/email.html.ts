import { SERVER_URL } from '../../common/const/path.const';
import { SendJoiningEmailDto } from '../../member/dtos/send-joining-email.dto';
import { Profile } from '../../profile/entities/profile.entity';
import { TeamModel } from '../../team/entities/team.entity';
import { User } from '../../user/entities/user.entity';

export const joinTeamHtml = (from: SendJoiningEmailDto, recipient: TeamModel, token: string) => {
    return `
    <p>안녕하세요, ${recipient.creator.name} 님</p>
    <p>${from.name} 회원님이 ${recipient.name} 구단에 입단 신청을 했습니다.</p>
    <p>수락하시겠습니까?</p>

    <form action="${SERVER_URL}/api/team/${recipient.id}/user/${from.id}/approve" method="POST">
    <input type="hidden" name="token" value="${token}">
    <button style="background-color: #4CAF50; color: white; padding: 10px 20px; text-align: center; text-decoration: none; display: inline-block; border-radius: 5px; cursor: pointer;">수락</button>
    </form>

    <form action="${SERVER_URL}/api/team/${recipient.id}/user/${from.id}/reject" method="POST">
    <input type="hidden" name="token" value="${token}">
    <button style="background-color: #4CAF50; color: white; padding: 10px 20px; text-align: center; text-decoration: none; display: inline-block; border-radius: 5px; cursor: pointer;">거절</button>
    </form>
  `;
};

export const inviteTeamHtml = (team: TeamModel, recipient: Profile, token: string) => {
console.log("team=",team)
  return `
  <p>안녕하세요, ${recipient.user.name} 님</p>
  <p>${team.creator.name} 구단주가 ${recipient.user.name} 님에게 입단 초대 신청을 했습니다.</p>
  <p>수락하시겠습니까?</p>

  <form action="${SERVER_URL}/api/team/${team.id}/user/${recipient.user.id}/approve" method="POST">
  <input type="hidden" name="token" value="${token}">
  <button style="background-color: #4CAF50; color: white; padding: 10px 20px; text-align: center; text-decoration: none; display: inline-block; border-radius: 5px; cursor: pointer;">수락</button>
  </form>

  <form action="${SERVER_URL}/api/team/${team.id}/user/${recipient.user.id}/reject" method="POST">
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
