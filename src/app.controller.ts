import { Controller, Get, Inject, Injectable } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('/logging')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  async getHello(): Promise<string> {
    return await this.appService.getHello();
  }
}
