import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AlunosModule } from './alunos/alunos.module';
import { ProfessoresModule } from './professores/professores.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AlunosModule,
    ProfessoresModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
