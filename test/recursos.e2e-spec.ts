import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DatabaseService } from '../src/database/database.service';

describe.each([
  ['alunos', 'curso'],
  ['professores', 'disciplina'],
])('%s (e2e)', (recurso, campo) => {
  let app: INestApplication;

  beforeEach(async () => {
    // Substitui apenas o driver: controller, service e repository são reais.
    const dados: Record<
      string,
      { id: number; nome: string; [key: string]: string | number }[]
    > = {
      alunos: [
        { id: 1, nome: 'Ana', curso: 'Sistemas de Informação' },
        { id: 2, nome: 'Carlos', curso: 'Ciência da Computação' },
      ],
      professores: [
        { id: 1, nome: 'João', disciplina: 'Programação Web' },
        { id: 2, nome: 'Mariana', disciplina: 'Banco de Dados' },
      ],
    };
    const ids: Record<string, number> = { alunos: 3, professores: 3 };
    const database = {
      async execute(sql: string, values: (string | number)[] = []) {
        const tabela = sql.includes('alunos') ? 'alunos' : 'professores';
        const campo = tabela === 'alunos' ? 'curso' : 'disciplina';
        const rows = dados[tabela];
        if (sql.startsWith('SELECT')) {
          return [
            sql.includes('WHERE')
              ? rows.filter((item) => item.id === values[0])
              : [...rows],
            [],
          ];
        }
        if (sql.startsWith('INSERT')) {
          const id = ids[tabela]++;
          rows.push({ id, nome: String(values[0]), [campo]: values[1] });
          return [{ insertId: id, affectedRows: 1 }, []];
        }
        if (sql.startsWith('UPDATE')) {
          const item = rows.find((row) => row.id === values[2]);
          if (item) {
            item.nome = String(values[0]);
            item[campo] = values[1];
          }
          return [{ affectedRows: item ? 1 : 0 }, []];
        }
        if (sql.startsWith('DELETE')) {
          const index = rows.findIndex((row) => row.id === values[0]);
          if (index !== -1) rows.splice(index, 1);
          return [{ affectedRows: index === -1 ? 0 : 1 }, []];
        }
        throw new Error('SQL inesperado: ' + sql);
      },
    };
    const module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DatabaseService)
      .useValue(database)
      .compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('integra controller, service e repository no CRUD com driver simulado', async () => {
    const server = app.getHttpServer();
    const base = '/' + recurso;
    const lista = await request(server).get(base).expect(200);
    expect(lista.body).toHaveLength(2);
    await request(server)
      .get(base + '/1')
      .expect(200)
      .expect(lista.body[0]);
    const body = { nome: 'Teste', [campo]: 'Inicial' };
    await request(server)
      .post(base)
      .send(body)
      .expect(201)
      .expect({ id: 3, ...body });
    const atualizado = { nome: 'Atualizado', [campo]: 'Final' };
    await request(server)
      .put(base + '/3')
      .send(atualizado)
      .expect(200)
      .expect({ id: 3, ...atualizado });
    await request(server)
      .get(base + '/3')
      .expect(200)
      .expect({ id: 3, ...atualizado });
    await request(server)
      .delete(base + '/1')
      .expect(200)
      .expect('1');
    await request(server)
      .post(base)
      .send(body)
      .expect(201)
      .expect({ id: 4, ...body });
    const final = await request(server).get(base).expect(200);
    expect(final.body.map((item: { id: number }) => item.id)).toEqual([
      2, 3, 4,
    ]);
  });

  it('rejeita IDs inválidos e trata atualização/exclusão de IDs ausentes', async () => {
    const server = app.getHttpServer();
    const base = '/' + recurso;
    await request(server)
      .get(base + '/abc')
      .expect(400);
    await request(server)
      .put(base + '/abc')
      .send({})
      .expect(400);
    await request(server)
      .delete(base + '/abc')
      .expect(400);
    await request(server)
      .put(base + '/999')
      .send({ nome: 'Teste', [campo]: 'Teste' })
      .expect(200)
      .expect('');
    await request(server)
      .delete(base + '/999')
      .expect(200)
      .expect('0');
  });
});
