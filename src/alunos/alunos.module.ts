import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AlunosController } from './alunos.controller.js';
import { AlunosRepository } from './alunos.repository.js';
import { AlunosService } from './alunos.service.js';

// O módulo agora importa o Prisma compartilhado em lugar do DatabaseModule.
@Module({
  imports: [PrismaModule],
  controllers: [AlunosController],
  providers: [AlunosService, AlunosRepository],
})
export class AlunosModule {}
