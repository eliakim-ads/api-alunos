import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ListAlunosDto } from './dto/list-alunos.dto.js';
import { PatchAlunoDto } from './dto/patch-aluno.dto.js';

// A seleção mantém o JSON conhecido pelo Bruno, sem expor a nova chave cursoId.
const alunoSelect = { id: true, nome: true, email: true, curso: true } as const;

@Injectable()
export class AlunosRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(query: ListAlunosDto = {}) {
    // Filtros combinados usam AND; a pesquisa por nome utiliza contains.
    // Sem paginação, a listagem continua retornando todos os registros.
    const paginar = query.page !== undefined || query.limit !== undefined;
    const limit = query.limit ?? 10;
    return this.prisma.aluno.findMany({
      select: alunoSelect,
      where: {
        ...(query.curso !== undefined ? { curso: query.curso } : {}),
        ...(query.nome !== undefined ? { nome: { contains: query.nome } } : {}),
      },
      orderBy: { id: 'asc' },
      ...(paginar
        ? { skip: ((query.page ?? 1) - 1) * limit, take: limit }
        : {}),
    });
  }

  findById(id: number) {
    return this.prisma.aluno.findUnique({ where: { id }, select: alunoSelect });
  }

  create(nome: string, email: string, curso: string) {
    // A escrita aninhada liga o aluno ao curso na mesma operação do Prisma.
    // O campo textual curso é mantido para preservar o contrato HTTP anterior.
    return this.prisma.aluno.create({
      data: {
        nome,
        email,
        curso,
        cursoDetalhes: {
          connectOrCreate: { where: { nome: curso }, create: { nome: curso } },
        },
      },
      select: alunoSelect,
    });
  }

  update(id: number, nome: string, email: string, curso: string) {
    return this.prisma.aluno.update({
      where: { id },
      data: {
        nome,
        email,
        curso,
        cursoDetalhes: {
          connectOrCreate: { where: { nome: curso }, create: { nome: curso } },
        },
      },
      select: alunoSelect,
    });
  }

  patch(id: number, data: PatchAlunoDto) {
    // Campos ausentes não são escritos; a relação muda somente ao enviar curso.
    return this.prisma.aluno.update({
      where: { id },
      data: {
        ...data,
        ...(data.curso !== undefined
          ? {
              cursoDetalhes: {
                connectOrCreate: {
                  where: { nome: data.curso },
                  create: { nome: data.curso },
                },
              },
            }
          : {}),
      },
      select: alunoSelect,
    });
  }

  async delete(id: number) {
    await this.prisma.aluno.delete({ where: { id } });
    // O service ainda verifica sucesso; delete agora devolve o registro, não affectedRows.
    return 1;
  }
}
