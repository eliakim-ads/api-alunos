import { Test } from '@nestjs/testing';
import { ValidationPipe, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DatabaseService } from '../src/database/database.service';

describe.each([
  ['alunos', 'curso'],
  ['professores', 'disciplina'],
  ['disciplinas', 'carga_horaria'],
])('%s (e2e)', (recurso, campo) => {
  let app: INestApplication;

  beforeEach(async () => {
    // Substitui apenas o driver: controller, service e repository são reais.
    const dados: Record<
      string,
      { id: number; nome: string; [key: string]: string | number }[]
    > = {
      alunos: [
        {
          id: 1,
          nome: 'Ana',
          email: 'ana@example.com',
          curso: 'Sistemas de Informação',
        },
        {
          id: 2,
          nome: 'Carlos',
          email: 'carlos@example.com',
          curso: 'Ciência da Computação',
        },
      ],
      disciplinas: [
        { id: 1, nome: 'Programação Web', carga_horaria: 80 },
        { id: 2, nome: 'Banco de Dados', carga_horaria: 60 },
      ],
      professores: [
        { id: 1, nome: 'João', disciplina: 'Programação Web' },
        { id: 2, nome: 'Mariana', disciplina: 'Banco de Dados' },
      ],
    };
    const ids: Record<string, number> = {
      alunos: 3,
      professores: 3,
      disciplinas: 3,
    };
    const database = {
      async execute(sql: string, values: (string | number)[] = []) {
        const tabela = sql.includes('alunos')
          ? 'alunos'
          : sql.includes('disciplinas')
            ? 'disciplinas'
            : 'professores';
        const campo =
          tabela === 'alunos'
            ? 'curso'
            : tabela === 'disciplinas'
              ? 'carga_horaria'
              : 'disciplina';
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
          rows.push({
            id,
            nome: String(values[0]),
            ...(tabela === 'alunos' ? { email: values[1] } : {}),
            [campo]: values[tabela === 'alunos' ? 2 : 1],
          });
          return [{ insertId: id, affectedRows: 1 }, []];
        }
        if (sql.startsWith('UPDATE')) {
          const item = rows.find((row) => row.id === values[values.length - 1]);
          if (item) {
            const columns = sql
              .split(' SET ')[1]
              .split(' WHERE ')[0]
              .split(',')
              .map((entry) => entry.trim().split(' ')[0]);
            columns.forEach((column, index) => {
              item[column] = values[index];
            });
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
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
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
    const body = {
      nome: 'Teste',
      ...(recurso === 'alunos' ? { email: 'teste@example.com' } : {}),
      [campo]: recurso === 'disciplinas' ? 80 : 'Inicial',
    };
    await request(server)
      .post(base)
      .send(body)
      .expect(201)
      .expect({ id: 3, ...body });
    const atualizado = {
      nome: 'Atualizado',
      ...(recurso === 'alunos' ? { email: 'atualizado@example.com' } : {}),
      [campo]: recurso === 'disciplinas' ? 100 : 'Final',
    };
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
      .expect(recurso === 'professores' ? 200 : 204)
      .expect(recurso === 'professores' ? '1' : '');
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

  it('valida DTOs e atualização parcial', async () => {
    if (recurso === 'professores') return;
    const server = app.getHttpServer();
    const base = '/' + recurso;
    const valid = {
      nome: 'Teste',
      ...(recurso === 'alunos' ? { email: 'teste@example.com' } : {}),
      [campo]: recurso === 'disciplinas' ? 80 : 'ADS',
    };
    for (const invalid of [
      {},
      { ...valid, nome: '' },
      { ...valid, nome: 123 },
      { ...valid, nome: 'a'.repeat(101) },
      { ...valid, [campo]: false },
    ]) {
      await request(server).post(base).send(invalid).expect(400);
      await request(server)
        .put(base + '/1')
        .send(invalid)
        .expect(400);
    }
    await request(server)
      .post(base)
      .send({ ...valid, admin: true })
      .expect(201)
      .expect({ id: 3, ...valid });
    if (recurso === 'alunos') {
      await request(server)
        .post(base)
        .send({ ...valid, email: 'abc' })
        .expect(400);
      await request(server)
        .post(base)
        .send({ ...valid, email: 'a'.repeat(151) })
        .expect(400);
      const before = await request(server)
        .get(base + '/1')
        .expect(200);
      await request(server)
        .patch(base + '/1')
        .send({ curso: 'Engenharia de Software', admin: true })
        .expect(200)
        .expect({ ...before.body, curso: 'Engenharia de Software' });
      await request(server)
        .patch(base + '/1')
        .send({ email: null })
        .expect(400);
      await request(server)
        .patch(base + '/1')
        .send({ email: 'abc' })
        .expect(400);
      await request(server)
        .patch(base + '/999')
        .send({ curso: 'ADS' })
        .expect(404);
    } else {
      for (const hours of [0, -1, 1.5, '80', 2147483648])
        await request(server)
          .post(base)
          .send({ ...valid, carga_horaria: hours })
          .expect(400);
    }
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
      .send({
        nome: 'Teste',
        ...(recurso === 'alunos' ? { email: 'teste@example.com' } : {}),
        [campo]: recurso === 'disciplinas' ? 60 : 'Teste',
      })
      .expect(recurso === 'professores' ? 200 : 404);
    await request(server)
      .get(base + '/999')
      .expect(recurso === 'professores' ? 200 : 404);
    await request(server)
      .delete(base + '/999')
      .expect(recurso === 'professores' ? 200 : 404);
  });
});
