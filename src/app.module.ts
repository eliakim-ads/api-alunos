import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AlunosModule } from './alunos/alunos.module';
import { ProfessoresModule } from './professores/professores.module';

@Module({
  imports: [AlunosModule, ProfessoresModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
