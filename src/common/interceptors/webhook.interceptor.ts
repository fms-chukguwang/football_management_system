import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { captureException } from '@sentry/minimal';
import { Observable, tap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { IncomingWebhook } from '@slack/client';
import * as Sentry from '@sentry/node';

@Injectable()
export class WebhookInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler) /** : Observable<any>*/ {
        const req = context.switchToHttp().getRequest();
        const method = req.method;
        const [, , path] = req.originalUrl.split('/');

        return next.handle().pipe(
            tap((observable) => {
                if (
                    path === 'admin' &&
                    (method === 'POST' || method === 'PUT' || method === 'DELETE')
                ) {
                    const webhook = new IncomingWebhook(process.env.SLACK_WEBHOOK);
                    webhook.send({
                        attachments: [
                            {
                                color: 'danger',
                                text: '어드민 계정으로 DB에 접근했습니다.',
                                fields: [
                                    {
                                        title: `Request Message: ${observable.message}`,
                                        value: observable.stack,
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
                // console.log('path=', path);
                // console.log('method=', method);
                Sentry.captureException(error);
                const webhook = new IncomingWebhook(process.env.SLACK_WEBHOOK);
                webhook.send({
                    attachments: [
                        {
                            color: 'danger',
                            text: 'FMS: 에러가 발생했어요 😭',
                            fields: [
                                {
                                    title: `Request Message: ${error.message}`,
                                    value: `path: ${path}, method: ${method}, ${error.stack}`,
                                    short: false,
                                },
                            ],
                            ts: Math.floor(new Date().getTime() / 1000).toString(), // unix form
                        },
                    ],
                });
                return error;
            }),
        );
    }
}
