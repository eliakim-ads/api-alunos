# API da escola — NestJS e Prisma ORM 7

Os CRUDs de alunos, professores e disciplinas usam Controller → Service → Repository → PrismaService → Prisma Client → adapter MariaDB → MySQL. A Aula 4 migrou a persistência e manteve os DTOs, validações e contratos HTTP existentes.

## Executar

1. Inicie o MySQL na porta 3306 (phpMyAdmin usa a porta 8001).
2. Configure .env a partir de .env.example. DB_* são usados pelo adapter no Nest; DATABASE_URL é usada pela CLI do Prisma. Mantenha os dois conjuntos sincronizados e codifique caracteres especiais da senha na URL.
3. Execute npm install.
4. Execute npm run prisma:generate e npm run prisma:deploy.
5. Execute npm run start:dev. A API usa http://localhost:3000.

Os scripts de build e start:dev também geram o Prisma Client automaticamente. O projeto usa ESM e Node.js 24. Os imports relativos TypeScript terminam em .js, para funcionarem após a compilação. src/generated/prisma é produzido pelo generator e não deve ser editado nem versionado.

Para executar a versão compilada: npm run build e npm run start:prod.

## Banco existente e migrations

A estrutura real foi descoberta com prisma db pull. A baseline 0_init inclui as três tabelas já existentes, com sua collation original, e foi marcada como aplicada sem recriar tabelas. A segunda migration acrescenta email único e a relação Curso–Aluno, preservando os registros antigos.

A tabela disciplinas e a coluna email já existiam; por isso entram na baseline. Não são criadas novamente como se o banco estivesse vazio. Os scripts sql/ são registros históricos das aulas anteriores; o schema de referência agora é prisma/schema.prisma.

Na relação, Aluno.cursoId aponta para Curso.id. O campo textual curso continua no JSON por compatibilidade. O repository mantém texto e relação sincronizados usando connectOrCreate ao criar ou alterar um curso. O schema usa fields/references para a FK e @@map/@map para os nomes físicos. O script de verificação demonstra include para carregar cursoDetalhes.

A alteração foi gerada e revisada como migration e aplicada com migrate deploy, sem reset do banco. Uma cópia local anterior à migração está em .tmp/antes-prisma.json (ignorada pelo Git).

Comandos disponíveis:

| Comando                                          | Uso                                      |
| ------------------------------------------------ | ---------------------------------------- |
| npm run prisma:pull                              | Descobrir mudanças já feitas no banco    |
| npm run prisma:generate                          | Gerar client e tipos após mudar o schema |
| npm run prisma:status                            | Conferir o histórico aplicado            |
| npm run prisma:migrate -- --name nome_da_mudanca | Criar migration no desenvolvimento       |
| npm run prisma:deploy                            | Aplicar migrations pendentes             |
| npm run prisma:studio                            | Abrir Prisma Studio para consultar dados |

Migrations aplicadas são imutáveis. Alterações futuras devem criar migrations novas. Ao usar db pull, revise os models e seus mapeamentos antes de gerar o client.

## Rotas e respostas

GET, POST, PUT e DELETE existem em /alunos, /professores e /disciplinas. Consultas, atualizações e exclusões individuais usam /:id. Alunos também oferecem PATCH /alunos/:id.

- POST retorna 201. PUT e consultas retornam 200.
- Alunos e disciplinas retornam 404 quando o ID não existe; DELETE bem-sucedido retorna 204 sem corpo.
- Professores mantêm o contrato anterior: DELETE retorna 1 ou 0, e busca/atualização de ID ausente retorna corpo vazio.
- IDs inválidos e DTOs inválidos retornam 400.
- E-mail duplicado retorna 409. O filtro também converte o erro P2025 do Prisma em 404.

## Filtros e paginação de alunos

Os filtros podem ser combinados. Curso usa igualdade; nome usa contains. O resultado continua sendo um array, ordenado por id.

- GET /alunos?curso=ADS
- GET /alunos?nome=Ana
- GET /alunos?page=1&limit=10
- GET /alunos?curso=ADS&nome=Ana&page=2&limit=5

Sem page e limit, a listagem retorna todos os registros. Ao enviar um deles, os padrões são page=1 e limit=10. limit aceita de 1 a 100; page precisa ser um inteiro positivo. Valores inválidos retornam 400.

## Corpos JSON no Bruno

POST /alunos e PUT /alunos/:id:

```json
{ "nome": "Maria", "email": "maria@senac.com", "curso": "ADS" }
```

PATCH /alunos/:id aceita somente os campos enviados e rejeita null:

```json
{ "curso": "Engenharia de Software" }
```

POST /disciplinas e PUT /disciplinas/:id:

```json
{ "nome": "Programação Web II", "carga_horaria": 80 }
```

cargaHoraria é o nome interno do Prisma, mapeado à coluna carga_horaria; o JSON mantém carga_horaria. Nome e curso são textos obrigatórios de até 100 caracteres. Email é válido, obrigatório e tem até 150 caracteres. Carga horária é um inteiro positivo dentro do limite do INT MySQL. Campos extras dos DTOs são removidos pelo whitelist.

## Verificação

- npm run build
- npm run lint
- npm test -- --runInBand
- npm run test:e2e -- --runInBand
- npm run test:mysql (requer o MySQL configurado e um build atualizado)

Os testes HTTP automatizados substituem somente PrismaService por uma implementação simulada. O teste MySQL usa os repositories reais, verifica CRUDs, filtros, paginação, PATCH, relações e unicidade, e remove os registros temporários que ele criou.
