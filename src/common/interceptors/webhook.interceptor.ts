import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { tap, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { IncomingWebhook } from '@slack/client';
import * as Sentry from '@sentry/node';

@Injectable()
export class WebhookInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler) /** : Observable<any>*/ {
        const now = new Date(); // 현재 시간과 날짜
        const hour = now.getHours(); // 현재 시간
        const req = context.switchToHttp().getRequest();
        const method = req.method;
        const headers = req.headers ? req.headers : {};
        const [, , path] = req.originalUrl.split('/');

        return next.handle().pipe(
            tap(() => {
                const isBetween2and6am = hour >= 2 && hour < 6;

                if (
                    path === 'admin' &&
                    isBetween2and6am &&
                    (method === 'POST' || method === 'PUT' || method === 'DELETE')
                ) {
                    const webhook = new IncomingWebhook(process.env.SLACK_WEBHOOK);
                    webhook.send({
                        attachments: [
                            {
                                color: 'danger',
                                text: '경고: 2-6 am에 어드민 계정으로 DB에 접근했습니다!',
                                fields: [
                                    {
                                        title: `Request Message: ${JSON.stringify(req.body)}`,
                                        value: `path: ${path}, method: ${method}`,
                                        short: false,
                                    },
                                ],
                                ts: Math.floor(new Date().getTime() / 1000).toString(), // unix form
                            },
                        ],
                    });
                    return null;
                }
            }),
            catchError((error) => {
                Sentry.captureException(error);
                const webhook = new IncomingWebhook(process.env.SLACK_WEBHOOK);
                webhook.send({
                    attachments: [
                        {
                            color: 'danger',
                            text: `FMS: url:${path}로 에러가 발생했어요 😭`,
                            fields: [
                                {
                                    title: `Request Message: ${error.message}`,
                                    value: `path: ${path}, method: ${method}, stack: ${error.stack}`,
                                    short: false,
                                },
                            ],
                            ts: Math.floor(new Date().getTime() / 1000).toString(), // unix form
                        },
                    ],
                });
                return throwError(() => error);
            }),
        );
    }
}
