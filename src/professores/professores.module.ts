import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ProfessoresController } from './professores.controller.js';
import { ProfessoresRepository } from './professores.repository.js';
import { ProfessoresService } from './professores.service.js';

// O módulo agora importa o Prisma compartilhado em lugar do DatabaseModule.
@Module({
  imports: [PrismaModule],
  controllers: [ProfessoresController],
  providers: [ProfessoresService, ProfessoresRepository],
})
export class ProfessoresModule {}
