import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

// Um provider compartilhado evita criar um pool para cada repository.
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
