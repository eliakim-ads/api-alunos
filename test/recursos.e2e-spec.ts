import { Test } from '@nestjs/testing';
import { ValidationPipe, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { createPrismaMock } from './prisma.mock.js';

describe.each([
  ['alunos', 'curso'],
  ['professores', 'disciplina'],
  ['disciplinas', 'carga_horaria'],
])('%s (e2e)', (recurso, campo) => {
  let app: INestApplication;

  beforeEach(async () => {
    const prisma = createPrismaMock();
    const module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
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

  it('integra controller, service e repository no CRUD com Prisma simulado', async () => {
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
      .send({
        ...body,
        ...(recurso === 'alunos' ? { email: 'outro@example.com' } : {}),
      })
      .expect(201)
      .expect({
        id: 4,
        ...body,
        ...(recurso === 'alunos' ? { email: 'outro@example.com' } : {}),
      });
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

  it('combina filtros, paginação e restrição de e-mail único', async () => {
    if (recurso !== 'alunos') return;
    const server = app.getHttpServer();
    const byCourse = await request(server)
      .get('/alunos?curso=Sistemas%20de%20Informa%C3%A7%C3%A3o')
      .expect(200);
    expect(byCourse.body.map((row: { id: number }) => row.id)).toEqual([1]);
    const byName = await request(server).get('/alunos?nome=arl').expect(200);
    expect(byName.body.map((row: { id: number }) => row.id)).toEqual([2]);
    const page = await request(server)
      .get('/alunos?page=2&limit=1')
      .expect(200);
    expect(page.body.map((row: { id: number }) => row.id)).toEqual([2]);
    await request(server).get('/alunos?page=0').expect(400);
    await request(server).get('/alunos?page=abc').expect(400);
    await request(server).get('/alunos?limit=101').expect(400);
    await request(server).get('/alunos?limit=1.5').expect(400);
    await request(server)
      .post('/alunos')
      .send({ nome: 'Duplicado', email: 'ana@example.com', curso: 'ADS' })
      .expect(409);
    await request(server)
      .patch('/alunos/2')
      .send({ email: 'ana@example.com' })
      .expect(409);
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
