import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import { LoggingService } from './logging/logging.service';
import { BadRequestException, HttpStatus, INestApplication } from '@nestjs/common';
import { AppController } from './app.controller';
import * as request from 'supertest';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;
  let loggingService: LoggingService;
  let app: INestApplication;
  
  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        LoggingService,
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('getHello', () => {
    it('should return "Hello World!"', async () => {
      const response = await request(app.getHttpServer())
      .get('')
      .expect(HttpStatus.OK);
      expect(response.body.statusCode).toEqual(HttpStatus.OK);
      expect(await appController.getHello()).toBe('Hello World!');
    });
  });

  describe('test', () => {
    it('should throw an error', async () => {
      await expect(appController.test()).rejects.toThrowError('test');
    });
  });

  describe('test2', () => {
    it('should throw a BadRequestException and log a warning message', async () => {
      jest.spyOn(loggingService, 'warn').mockResolvedValueOnce();
      
      await expect(appController.test2()).rejects.toThrowError(BadRequestException);
      expect(loggingService.warn).toHaveBeenCalledWith('테스트2가 경고를 발생시켰습니다.');
    });
  });
});
