import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ProfessoresController } from './professores.controller';
import { ProfessoresRepository } from './professores.repository';
import { ProfessoresService } from './professores.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ProfessoresController],
  providers: [ProfessoresService, ProfessoresRepository],
})
export class ProfessoresModule {}
