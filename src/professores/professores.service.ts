import { Injectable } from '@nestjs/common';

@Injectable()
export class ProfessoresService {
  private professores = [
    { id: 1, nome: 'João', disciplina: 'Programação Web' },
    { id: 2, nome: 'Mariana', disciplina: 'Banco de Dados' },
  ];
  private proximoId = 3;

  findAll() {
    return this.professores;
  }

  findById(id: number) {
    return this.professores.find((item) => item.id === id);
  }

  create(nome: string, disciplina: string) {
    const novo = { id: this.proximoId++, nome, disciplina };
    this.professores.push(novo);
    return novo;
  }

  update(id: number, nome: string, disciplina: string) {
    const item = this.findById(id);
    if (!item) {
      return null;
    }
    item.nome = nome;
    item.disciplina = disciplina;
    return item;
  }

  delete(id: number) {
    const index = this.professores.findIndex((item) => item.id === id);
    if (index === -1) {
      return false;
    }
    this.professores.splice(index, 1);
    return true;
  }
}
