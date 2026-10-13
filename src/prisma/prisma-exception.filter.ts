import {
  ArgumentsHost,
  Catch,
  ConflictException,
  ExceptionFilter,
  NotFoundException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '../generated/prisma/client.js';

// Erros de integridade do ORM precisam continuar produzindo respostas HTTP úteis.
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter
  extends BaseExceptionFilter
  implements ExceptionFilter
{
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    if (exception.code === 'P2002') {
      super.catch(
        new ConflictException('Já existe um registro com esse valor único'),
        host,
      );
      return;
    }
    if (exception.code === 'P2025') {
      super.catch(new NotFoundException('Registro não encontrado'), host);
      return;
    }
    super.catch(exception, host);
  }
}
