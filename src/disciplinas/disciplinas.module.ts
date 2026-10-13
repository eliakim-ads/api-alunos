import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { DisciplinasController } from './disciplinas.controller';
import { DisciplinasService } from './disciplinas.service';
import { DisciplinasRepository } from './disciplinas.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [DisciplinasController],
  providers: [DisciplinasService, DisciplinasRepository],
})
export class DisciplinasModule {}
