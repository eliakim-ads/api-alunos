import { Injectable } from '@nestjs/common';
import { AlunosRepository } from './alunos.repository';

@Injectable()
export class AlunosService {
  constructor(private readonly repository: AlunosRepository) {}

  findAll() {
    return this.repository.findAll();
  }

  findById(id: number) {
    return this.repository.findById(id);
  }

  create(nome: string, curso: string) {
    return this.repository.create(nome, curso);
  }

  async update(id: number, nome: string, curso: string) {
    await this.repository.update(id, nome, curso);
    return this.repository.findById(id);
  }

  delete(id: number) {
    return this.repository.delete(id);
  }
}
