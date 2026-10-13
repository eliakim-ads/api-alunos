import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { DisciplinasController } from './disciplinas.controller.js';
import { DisciplinasService } from './disciplinas.service.js';
import { DisciplinasRepository } from './disciplinas.repository.js';

// O módulo agora importa o Prisma compartilhado em lugar do DatabaseModule.
@Module({
  imports: [PrismaModule],
  controllers: [DisciplinasController],
  providers: [DisciplinasService, DisciplinasRepository],
})
export class DisciplinasModule {}
