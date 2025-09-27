import { Test, TestingModule } from '@nestjs/testing';
import { FootbalService } from './footbal.service';

describe('FootbalService', () => {
  let service: FootbalService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FootbalService],
    }).compile();

    service = module.get<FootbalService>(FootbalService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
