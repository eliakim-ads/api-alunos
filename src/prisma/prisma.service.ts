import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor(config: ConfigService) {
    // Prisma 7 utiliza um driver adapter; ele substitui o pool manual do mysql2.
    const adapter = new PrismaMariaDb({
      host: config.getOrThrow<string>('DB_HOST'),
      port: Number(config.get<string>('DB_PORT', '3306')),
      user: config.getOrThrow<string>('DB_USER'),
      password: config.getOrThrow<string>('DB_PASSWORD'),
      database: config.getOrThrow<string>('DB_NAME'),
      connectionLimit: 10,
    });
    super({ adapter });
  }

  async onModuleDestroy() {
    // O hook existente do Nest agora libera as conexões pelo Prisma.
    await this.$disconnect();
  }
}
