import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { Disciplina } from '../generated/prisma/client.js';

// @map no schema usa cargaHoraria no ORM; a API mantém carga_horaria no JSON.
function toResponse(row: Disciplina) {
  return { id: row.id, nome: row.nome, carga_horaria: row.cargaHoraria };
}

@Injectable()
export class DisciplinasRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const rows = await this.prisma.disciplina.findMany({
      orderBy: { id: 'asc' },
    });
    return rows.map(toResponse);
  }

  async findById(id: number) {
    const row = await this.prisma.disciplina.findUnique({ where: { id } });
    return row ? toResponse(row) : null;
  }

  async create(nome: string, carga_horaria: number) {
    return toResponse(
      await this.prisma.disciplina.create({
        data: { nome, cargaHoraria: carga_horaria },
      }),
    );
  }

  async update(id: number, nome: string, carga_horaria: number) {
    return toResponse(
      await this.prisma.disciplina.update({
        where: { id },
        data: { nome, cargaHoraria: carga_horaria },
      }),
    );
  }

  async delete(id: number) {
    await this.prisma.disciplina.delete({ where: { id } });
    return 1;
  }
}
