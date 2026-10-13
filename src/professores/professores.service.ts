import { Injectable } from '@nestjs/common';
import { ProfessoresRepository } from './professores.repository';

@Injectable()
export class ProfessoresService {
  constructor(private readonly repository: ProfessoresRepository) {}

  findAll() {
    return this.repository.findAll();
  }

  findById(id: number) {
    return this.repository.findById(id);
  }

  create(nome: string, disciplina: string) {
    return this.repository.create(nome, disciplina);
  }

  async update(id: number, nome: string, disciplina: string) {
    await this.repository.update(id, nome, disciplina);
    return this.repository.findById(id);
  }

  delete(id: number) {
    return this.repository.delete(id);
  }
}
