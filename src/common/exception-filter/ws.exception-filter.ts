import { Catch, HttpException } from '@nestjs/common';
import { BaseWsExceptionFilter } from '@nestjs/websockets';

@Catch(HttpException)
export class WsExceptionFilter extends BaseWsExceptionFilter<HttpException> {
  catch(exception: HttpException, host) {
    const socket = host.switchToWs().getClient();
    socket.emit('exception', { data: exception.getResponse() });
  }
}
