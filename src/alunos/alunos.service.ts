import { Injectable, NotFoundException } from '@nestjs/common';
import { AlunosRepository } from './alunos.repository';
import { CreateAlunoDto } from './dto/create-aluno.dto';
import { UpdateAlunoDto } from './dto/update-aluno.dto';
import { PatchAlunoDto } from './dto/patch-aluno.dto';

@Injectable()
export class AlunosService {
  constructor(private readonly repository: AlunosRepository) {}

  findAll() {
    return this.repository.findAll();
  }

  async findById(id: number) {
    const aluno = await this.repository.findById(id);
    if (!aluno) throw new NotFoundException('Aluno não encontrado');
    return aluno;
  }

  create(data: CreateAlunoDto) {
    return this.repository.create(data.nome, data.email, data.curso);
  }

  async update(id: number, data: UpdateAlunoDto) {
    await this.findById(id);
    await this.repository.update(id, data.nome, data.email, data.curso);
    return this.findById(id);
  }

  async patch(id: number, data: PatchAlunoDto) {
    await this.findById(id);
    await this.repository.patch(id, data);
    return this.findById(id);
  }

  async delete(id: number) {
    await this.findById(id);
    const affected = await this.repository.delete(id);
    if (!affected) throw new NotFoundException('Aluno não encontrado');
  }
}
