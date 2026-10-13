import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ProfessoresRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Os repositories passam a usar delegates tipados do Prisma, sem SQL manual.
  findAll() {
    return this.prisma.professor.findMany({ orderBy: { id: 'asc' } });
  }

  findById(id: number) {
    return this.prisma.professor.findUnique({ where: { id } });
  }

  create(nome: string, disciplina: string) {
    return this.prisma.professor.create({ data: { nome, disciplina } });
  }

  async update(id: number, nome: string, disciplina: string) {
    // updateMany preserva o retorno null/200 da API anterior quando o ID não existe.
    const result = await this.prisma.professor.updateMany({
      where: { id },
      data: { nome, disciplina },
    });
    return result.count;
  }

  async delete(id: number) {
    const result = await this.prisma.professor.deleteMany({ where: { id } });
    return result.count;
  }
}
