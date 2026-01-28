# @motochefe/api

Backend da Universidade MotoChefe construído com NestJS.

## Tecnologias

- NestJS 10
- Prisma ORM
- PostgreSQL
- Redis + BullMQ
- Passport.js (JWT/OIDC)

## Endpoints Principais

### Autenticação
- `GET /api/auth/me` - Dados do usuário autenticado

### Catálogo
- `GET /api/catalog` - Lista cursos (filtrado por franquia/cargo)
- `GET /api/catalog/continue-watching` - Aulas em progresso
- `GET /api/catalog/required` - Cursos obrigatórios

### Cursos
- `GET /api/courses/:id` - Detalhes do curso
- `POST /api/courses` - Criar curso (admin)
- `PUT /api/courses/:id` - Atualizar curso (admin)

### Progresso
- `POST /api/progress/heartbeat` - Atualiza progresso do vídeo
- `POST /api/progress/complete` - Marca aula como concluída

### xAPI
- `POST /api/xapi/statements` - Proxy para envio de statements ao LRS

### Upload
- `POST /api/admin/upload/video/presign` - Gera URL assinada
- `POST /api/admin/upload/video/complete` - Notifica upload concluído

## Scripts

```bash
# Desenvolvimento
pnpm dev

# Build
pnpm build

# Testes
pnpm test

# Prisma
pnpm prisma generate  # Gera client
pnpm prisma migrate dev  # Cria migration
pnpm prisma db seed  # Seed de dados
pnpm prisma studio  # UI de banco
```

## Variáveis de Ambiente

Veja `.env.example` na raiz do monorepo.
