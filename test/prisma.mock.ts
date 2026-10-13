import { Prisma } from '../src/generated/prisma/client.js';

type Row = { id: number; nome: string; [key: string]: string | number };
type Options = {
  where?: { id?: number; curso?: string; nome?: { contains: string } };
  data?: Record<string, unknown>;
  skip?: number;
  take?: number;
};

// Apenas a fronteira Prisma é simulada; HTTP, DTOs, services e repositories são reais.
export function createPrismaMock() {
  function delegate(initial: Row[], uniqueEmail = false) {
    const rows = initial.map((row) => ({ ...row }));
    let nextId = 3;
    function scalarData(data: Record<string, unknown> = {}) {
      return Object.fromEntries(
        Object.entries(data).filter(
          ([, value]) => typeof value === 'string' || typeof value === 'number',
        ),
      );
    }
    function ensureUnique(data: Record<string, unknown>, id?: number) {
      if (
        uniqueEmail &&
        data.email !== undefined &&
        rows.some((row) => row.id !== id && row.email === data.email)
      ) {
        throw new Prisma.PrismaClientKnownRequestError('E-mail duplicado', {
          code: 'P2002',
          clientVersion: 'test',
        });
      }
    }
    function missing() {
      throw new Prisma.PrismaClientKnownRequestError('Registro inexistente', {
        code: 'P2025',
        clientVersion: 'test',
      });
    }
    return {
      async findMany(options: Options = {}) {
        const filtered = rows.filter(
          (row) =>
            (options.where?.curso === undefined ||
              row.curso === options.where.curso) &&
            (options.where?.nome === undefined ||
              row.nome
                .toLowerCase()
                .includes(options.where.nome.contains.toLowerCase())),
        );
        const skip = options.skip ?? 0;
        return filtered
          .slice(
            skip,
            options.take === undefined ? undefined : skip + options.take,
          )
          .map((row) => ({ ...row }));
      },
      async findUnique(options: Options) {
        const row = rows.find((item) => item.id === options.where?.id);
        return row ? { ...row } : null;
      },
      async create(options: Options) {
        ensureUnique(options.data ?? {});
        const row = { id: nextId++, ...scalarData(options.data) } as Row;
        rows.push(row);
        return { ...row };
      },
      async update(options: Options) {
        const row = rows.find((item) => item.id === options.where?.id);
        if (!row) return missing();
        ensureUnique(options.data ?? {}, row.id);
        Object.assign(row, scalarData(options.data));
        return { ...row };
      },
      async delete(options: Options) {
        const index = rows.findIndex((item) => item.id === options.where?.id);
        if (index === -1) return missing();
        return rows.splice(index, 1)[0];
      },
      async updateMany(options: Options) {
        const row = rows.find((item) => item.id === options.where?.id);
        if (row) Object.assign(row, scalarData(options.data));
        return { count: row ? 1 : 0 };
      },
      async deleteMany(options: Options) {
        const index = rows.findIndex((item) => item.id === options.where?.id);
        if (index !== -1) rows.splice(index, 1);
        return { count: index === -1 ? 0 : 1 };
      },
    };
  }
  return {
    aluno: delegate(
      [
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
      true,
    ),
    professor: delegate([
      { id: 1, nome: 'João', disciplina: 'Programação Web' },
      { id: 2, nome: 'Mariana', disciplina: 'Banco de Dados' },
    ]),
    disciplina: delegate([
      { id: 1, nome: 'Programação Web', cargaHoraria: 80 },
      { id: 2, nome: 'Banco de Dados', cargaHoraria: 60 },
    ]),
  };
}
