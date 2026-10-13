import { Injectable, NotFoundException } from '@nestjs/common';
import { DisciplinasRepository } from './disciplinas.repository';
import { CreateDisciplinaDto } from './dto/create-disciplina.dto';
import { UpdateDisciplinaDto } from './dto/update-disciplina.dto';

@Injectable()
export class DisciplinasService {
  constructor(private readonly repository: DisciplinasRepository) {}

  findAll() {
    return this.repository.findAll();
  }

  async findById(id: number) {
    const disciplina = await this.repository.findById(id);
    if (!disciplina) throw new NotFoundException('Disciplina não encontrada');
    return disciplina;
  }

  create(data: CreateDisciplinaDto) {
    return this.repository.create(data.nome, data.carga_horaria);
  }

  async update(id: number, data: UpdateDisciplinaDto) {
    await this.findById(id);
    await this.repository.update(id, data.nome, data.carga_horaria);
    return this.findById(id);
  }

  async delete(id: number) {
    await this.findById(id);
    const affected = await this.repository.delete(id);
    if (!affected) throw new NotFoundException('Disciplina não encontrada');
  }
}
