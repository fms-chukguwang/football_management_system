import {
  ExecutionContext,
  InternalServerErrorException,
  createParamDecorator,
} from '@nestjs/common';

export const qr = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest();

    if (!req.qr) {
      throw new InternalServerErrorException(
        `TransactionInterceptor가 적용되지 않았습니다.`,
      );
    }

    return req.qr;
  },
);
