import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe.each([
  ['alunos', 'curso'],
  ['professores', 'disciplina'],
])('%s (e2e)', (recurso, campo) => {
  let app: INestApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('lista, busca, cria, atualiza e exclui dados em memória', async () => {
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
      .expect('true');
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
      .expect('false');
  });
});
