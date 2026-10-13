import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

// No Prisma 7, a CLI lê a URL aqui; o schema mantém somente o provider.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: env('DATABASE_URL') },
});
