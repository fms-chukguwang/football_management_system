import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();
    const req = ctx.getRequest();
    const status = exception.getStatus();
    res.status(status).json({
      statusCode: status,
      timestamp: new Date().toLocaleString('ko-KR', {
        timeZone: 'Asia/Seoul',
      }),
      path: req.url,
    });
  }
}
