import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as dotenv from 'dotenv';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // .env 파일을 현재 환경에 로드
  dotenv.config();

  const corsOptions = {
    origin: 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    allowedHeaders: 'Origin,X-Requested-With,Content-Type,Accept,Authorization',
  };

  app.enableCors(corsOptions);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('SERVER_PORT');

  app.setGlobalPrefix('api', { exclude: ['/health-check'] });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Sparta Node.js TS')
    .setDescription('Document for Sparta Node.js TS')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }) // JWT 사용을 위한 설정
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // 새로고침 시에도 JWT 유지하기
      tagsSorter: 'alpha', // API 그룹 정렬을 알파벳 순으로
      operationsSorter: 'alpha', // API 그룹 내 정렬을 알파벳 순으로
    },
  });

  await app.listen(port);
}
bootstrap();
