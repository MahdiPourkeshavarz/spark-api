import { Test, TestingModule } from '@nestjs/testing';
import { FootbalController } from './football.controller';
import { FootbalService } from './footbal.service';

describe('FootbalController', () => {
  let controller: FootbalController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FootbalController],
      providers: [FootbalService],
    }).compile();

    controller = module.get<FootbalController>(FootbalController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
