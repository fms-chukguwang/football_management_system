import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import * as nodemailer from 'nodemailer';
import { EmailRequest } from 'src/match/dtos/email-request.dto';
import { SendJoiningEmailDto } from 'src/member/dtos/send-joining-email.dto';
import { TeamModel } from 'src/team/entities/team.entity';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import { promisify } from 'util';
import { AuthService } from '../auth/auth.service';
import { EmailVerification } from '../email/entities/email.entity';
import { TeamJoinRequestToken } from './entities/team-join-request-token.entity';
import { joinTeamHtml, rejectTeamHtml } from './html/email.html';
import { v4 } from 'uuid';
import { RedisService } from '../redis/redis.service';

const randomBytesAsync = promisify(randomBytes);

@Injectable()
export class EmailService {
    private authService: AuthService;

    private transporter;
    private readonly max_attempts = 3;
    private readonly expiry_duration = 3 * 60 * 1000; // 3분

    constructor(
        @InjectRepository(EmailVerification)
        private readonly emailVerificationRepository: Repository<EmailVerification>,
        @InjectRepository(TeamJoinRequestToken)
        private readonly teamJoinRequestTokenRepository: Repository<TeamJoinRequestToken>,
        private readonly redisService: RedisService,
    ) {
        // 이메일 전송을 위한 transporter 설정
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER, // 발신자 이메일
                pass: process.env.EMAIL_PASS, // 발신자 이메일 비밀번호
            },
        });
    }

    async sendEmail(email: string, subject: string, text: string) {
        const mailOptions = {
            from: process.env.EMAIL_USER, // 발신자 이메일
            to: email,
            subject: subject,
            text: text,
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
        } catch (error) {
            console.error('Error sending email:', error);
        }
    }

    async generateVerificationCode(
        email: string,
    ): Promise<{ code: string; expiry: Date; remainingTime?: number }> {
        let verificationCode: string;
        let expiry: Date;

        const existingCode = await this.emailVerificationRepository.findOne({
            where: { email },
        });

        if (existingCode) {
            if (existingCode.attempts >= this.max_attempts) {
                // 기존 코드 삭제
                await this.emailVerificationRepository.delete({ email });
            }
        }

        // 새로운 코드 생성
        verificationCode = (await randomBytesAsync(6)).toString('hex');
        expiry = new Date();
        expiry.setTime(expiry.getTime() + this.expiry_duration);

        // 데이터베이스에 저장 또는 업데이트
        await this.emailVerificationRepository.save({
            email,
            code: verificationCode,
            expiry,
        });

        const remainingTime = Math.max(0, Math.ceil((expiry.getTime() - Date.now()) / 1000));
        return { code: verificationCode, expiry, remainingTime };
    }

    async sendVerificationEmail(
        email: string,
    ): Promise<{ code: string; expiry: Date; remainingTime?: number }> {
        try {
            // 이메일에 대한 기존 인증 정보 확인
            const existingVerification = await this.emailVerificationRepository.findOne({
                where: { email },
            });

            let code: string;
            let expiry: Date;
            console.log(existingVerification);
            if (existingVerification) {
                // 이미 존재하는 인증 정보가 있을 경우 해당 코드와 만료 일자 재사용
                code = existingVerification.code;
                expiry = existingVerification.expiry;
            } else {
                // 존재하지 않는 경우 새로운 인증 코드 및 만료 일자 생성
                const { code: newCode, expiry: newExpiry } =
                    await this.generateVerificationCode(email);
                code = newCode;
                expiry = newExpiry;

                // 새로운 인증 정보 저장
                await this.emailVerificationRepository.save({
                    email,
                    code,
                    expiry,
                });
            }

            const subject = '이메일 인증 번호';
            const remainingTime = Math.max(0, Math.ceil((expiry.getTime() - Date.now()) / 1000));

            // 이메일 전송 옵션 설정
            const mailOptions = {
                from: process.env.EMAIL_USER, // 발신자 이메일
                to: email,
                subject: subject,
                text: code,
            };

            try {
                // 이메일 전송 시도
                const info = await this.transporter.sendMail(mailOptions);
            } catch (error) {
                console.error('이메일 전송 중 오류 발생:', error);
            }

            // 생성된 코드, 만료 일자, 남은 시간 반환
            return { code, expiry, remainingTime };
        } catch (error) {
            // 오류가 발생한 경우 적절히 처리
            console.error('오류:', error);
            throw error;
        }
    }

    async verifyCode(email: string, code: string): Promise<boolean> {
        const savedCode = await this.emailVerificationRepository.findOne({
            where: { email },
        });

        // 인증번호가 일치하고, 유효 기간 내에 있는 경우
        if (
            savedCode &&
            savedCode.code === code &&
            (await this.isValidExpiration(savedCode.expiry))
        ) {
            // 기존에 저장된 인증번호 삭제
            await this.emailVerificationRepository.delete({ email });
            return true;
        }

        // 인증번호가 일치하지 않거나, 유효 기간이 지났을 경우
        if (savedCode) {
            savedCode.attempts += 1;
            await this.emailVerificationRepository.save(savedCode);

            // 시도 횟수가 허용 범위를 초과하면 회원을 휴면 상태로 전환
            if (savedCode.attempts >= this.max_attempts) {
                console.log(`User with email ${email} exceeded maximum verification attempts.`);
                // 휴먼 계정 전환
                await this.authService.updateUserToInactive(email);
            }
        }

        return false;
    }

    async isValidExpiration(expiration: Date): Promise<boolean> {
        const currentDateTime = new Date();
        return expiration > currentDateTime;
    }

    async reqMatchEmail(emailRequest: EmailRequest) {
        const newSchedule = emailRequest.newSchedule; // '2024-01-19 20:00:00'
        const parts = newSchedule.split(' '); // 공백을 기준으로 분리
        const threeDay = this.getThreeDaysLater();

        const date = parts[0]; // '2024-01-19'
        const time = parts[1]; // '20:00:00'

        const updateMent = `
        <li>제안하는 새 일정: ${newSchedule}</li>
    `;

        const htmlContent = `
      <p>안녕하세요, ${emailRequest.clubName} 구단주님.</p>
      <p>다음의 경기 일정에 대한 ${emailRequest.chk === 'update' ? '수정' : emailRequest.chk === 'delete' ? '삭제' : '제안'}요청 합니다:</p>
      <ul>
        <li>경기 일자: ${emailRequest.originalSchedule}</li>
        ${emailRequest.chk === 'update' ? updateMent : ''}
        <li>사유: ${emailRequest.reason}</li>
      </ul>
      <p>${threeDay} 이후로는 수락 불가하니 확인 바랍니다.<br></p>
      <p>감사합니다.<br>${emailRequest.senderName}</p>
      <form action="${emailRequest.url}" method="POST">
      ${
          emailRequest.chk !== 'delete'
              ? `
      <input type ="hidden" name = "date" value = ${date}>
      <input type ="hidden" name = "time" value = ${time}>
      `
              : ''
      }
      ${
          emailRequest.chk === 'create'
              ? `
      <input type ="hidden" name = "homeTeamId" value = ${emailRequest.homeTeamId}>
      <input type ="hidden" name = "awayTeamId" value = ${emailRequest.awayTeamId}>
      <input type ="hidden" name = "fieldId" value = ${emailRequest.fieldId}>
      `
              : `<input type ="hidden" name = "reason" value = ${emailRequest.reason}>`
      }
      
      <input type ="hidden" name = "token" value = ${emailRequest.token}>
      <button style="background-color: #4CAF50; color: white; padding: 10px 20px; text-align: center; text-decoration: none; display: inline-block; border-radius: 5px; cursor: pointer;">수락</button>
      </form>
      `;

        const mailOptions = {
            from: process.env.EMAIL_USER, // 발신자 이메일
            to: emailRequest.email,
            subject: emailRequest.subject,
            html: htmlContent, // HTML 형식의 메일 내용
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
        } catch (error) {
            console.error('Error sending email:', error);
        }
    }

    private getThreeDaysLater() {
        const now = new Date();
        const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 현재 시간에 3일을 더함

        const year = threeDaysLater.getFullYear();
        const month = threeDaysLater.getMonth() + 1; // getMonth()는 0부터 시작하므로 1을 더해줌
        const date = threeDaysLater.getDate();
        const hours = threeDaysLater.getHours();
        const minutes = threeDaysLater.getMinutes();
        //const seconds = threeDaysLater.getSeconds();
        const seconds = '00';

        // 숫자가 10보다 작으면 앞에 0을 붙여줌
        const formatNumber = (num) => (num < 10 ? `0${num}` : num);

        return `${year}-${formatNumber(month)}-${formatNumber(date)} ${formatNumber(hours)}:${formatNumber(minutes)}:${seconds}`;
    }

    /**
     * 구단에게 입단 요청하기
     * @param from
     * @param recipient
     */
    async sendTeamJoinEmail(from: SendJoiningEmailDto, recipient: TeamModel) {
        const randomToken = v4();

        const mailOptions = {
            from: process.env.EMAIL_USER, // 발신자 이메일
            to: recipient.creator.email,
            subject: `${from.name}님의 구단 입단 신청입니다.`,
            html: joinTeamHtml(from, recipient, randomToken), // HTML 형식의 메일 내용
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            await this.redisService.setTeamJoinMailToken(randomToken);
            return info;
        } catch (error) {
            console.error('Error sending email:', error);
        }
    }

    /**
     * 입단 거절 email 전송
     * @param temaName
     * @param user
     * @returns
     */
    async sendTeamRejectEmail(temaName: string, user: User) {
        const mailOptions = {
            from: process.env.EMAIL_USER, // 발신자 이메일
            to: user.email,
            subject: `${temaName} 구단 입단신청이 거절되었습니다.`,
            html: rejectTeamHtml(temaName, user), // HTML 형식의 메일 내용
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            return info;
        } catch (error) {
            console.error('Error sending email:', error);
        }
    }

    /**
     * 토큰을 데이터베이스에 저장한다.
     * @param team
     * @param userId
     * @param token
     */
    async saveEmailVerificationToken(team: TeamModel, userId: number, token: string) {
        await this.teamJoinRequestTokenRepository.save({
            creatorId: team.creator.id,
            userId,
            token,
        });
    }

    /**
     * 토큰 값으로 데이터베이스에서 토큰정보 검색한다.
     * @param token
     * @returns
     */
    async findEmailVerificationToken(token: string) {
        return await this.teamJoinRequestTokenRepository.findOne({
            where: {
                token,
            },
        });
    }

    /**
     * 토큰 값을 이용하여 데이터베이스에서 해당 토큰을 삭제
     * @param token
     * @returns
     */
    async deleteEmailVerificationToken(token: string) {
        return await this.teamJoinRequestTokenRepository.delete({ token });
    }
}
