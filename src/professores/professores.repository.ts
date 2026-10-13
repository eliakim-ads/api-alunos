import { Injectable } from '@nestjs/common';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { DatabaseService } from '../database/database.service';

export interface ProfessorRow extends RowDataPacket {
  id: number;
  nome: string;
  disciplina: string;
}

@Injectable()
export class ProfessoresRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll() {
    const [rows] = await this.databaseService.execute<ProfessorRow[]>(
      'SELECT id, nome, disciplina FROM professores ORDER BY id',
    );
    return rows;
  }

  async findById(id: number) {
    const [rows] = await this.databaseService.execute<ProfessorRow[]>(
      'SELECT id, nome, disciplina FROM professores WHERE id = ?',
      [id],
    );
    return rows[0] ?? null;
  }

  async create(nome: string, disciplina: string) {
    const [result] = await this.databaseService.execute<ResultSetHeader>(
      'INSERT INTO professores (nome, disciplina) VALUES (?, ?)',
      [nome, disciplina],
    );
    return { id: result.insertId, nome, disciplina };
  }

  async update(id: number, nome: string, disciplina: string) {
    const [result] = await this.databaseService.execute<ResultSetHeader>(
      'UPDATE professores SET nome = ?, disciplina = ? WHERE id = ?',
      [nome, disciplina, id],
    );
    return result.affectedRows;
  }

  async delete(id: number) {
    const [result] = await this.databaseService.execute<ResultSetHeader>(
      'DELETE FROM professores WHERE id = ?',
      [id],
    );
    return result.affectedRows;
  }
}
