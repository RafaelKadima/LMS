# Arquitetura - Universidade MotoChefe

## Visão Geral dos Serviços

```
                                    ┌─────────────────────────────────────┐
                                    │           EDGE (Cloudflare)         │
                                    │  ┌─────────────┐  ┌──────────────┐  │
                                    │  │     CDN     │  │   Workers    │  │
                                    │  │  (Vídeos)   │  │ (Auth Edge)  │  │
                                    │  └─────────────┘  └──────────────┘  │
                                    └─────────────────────────────────────┘
                                                      │
                                                      ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                  APPLICATION LAYER                                │
│                                                                                   │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐       │
│  │     Next.js Web     │  │     NestJS API      │  │    NestJS Worker    │       │
│  │    (App Router)     │  │     (REST/WS)       │  │     (BullMQ)        │       │
│  │                     │  │                     │  │                     │       │
│  │  - SSR/SSG          │  │  - Auth Guards      │  │  - Video transcode  │       │
│  │  - React Query      │  │  - CRUD endpoints   │  │  - xAPI batch       │       │
│  │  - Video.js         │  │  - xAPI proxy       │  │  - Notifications    │       │
│  │  - Tailwind/shadcn  │  │  - File upload      │  │  - Reports          │       │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘       │
│            │                        │                        │                    │
└────────────┼────────────────────────┼────────────────────────┼────────────────────┘
             │                        │                        │
             ▼                        ▼                        ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                  DATA LAYER                                       │
│                                                                                   │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐       │
│  │     PostgreSQL      │  │       Redis         │  │   Cloudflare R2     │       │
│  │                     │  │                     │  │                     │       │
│  │  - Users/Courses    │  │  - Session cache    │  │  - Original videos  │       │
│  │  - Progress         │  │  - Rate limiting    │  │  - HLS segments     │       │
│  │  - Enrollments      │  │  - BullMQ queues    │  │  - Thumbnails       │       │
│  │  - Events outbox    │  │  - Real-time pub    │  │  - Documents        │       │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘       │
│                                                                                   │
└──────────────────────────────────────────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                              EXTERNAL SERVICES                                    │
│                                                                                   │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐       │
│  │      Keycloak       │  │   Learning Locker   │  │      Metabase       │       │
│  │                     │  │       (LRS)         │  │                     │       │
│  │  - OIDC/OAuth2      │  │  - xAPI statements  │  │  - Dashboards       │       │
│  │  - User management  │  │  - Analytics        │  │  - Reports          │       │
│  │  - SSO              │  │  - Compliance       │  │  - Exports          │       │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘       │
│                                                                                   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## Detalhamento por Serviço

### 1. Next.js Web (Portal)

**Responsabilidades:**
- Interface do usuário (aluno e admin)
- Server-side rendering para SEO e performance
- Comunicação com API via React Query
- Player de vídeo com Video.js

**Estrutura interna:**
```
apps/web/
├── src/
│   ├── app/                    # App Router (Next.js 14)
│   │   ├── (auth)/             # Rotas de autenticação
│   │   │   ├── login/
│   │   │   └── callback/
│   │   ├── (portal)/           # Rotas do portal (protegidas)
│   │   │   ├── catalog/
│   │   │   ├── courses/[id]/
│   │   │   ├── player/[lessonId]/
│   │   │   ├── tracks/
│   │   │   └── profile/
│   │   ├── (admin)/            # Rotas admin
│   │   │   ├── dashboard/
│   │   │   ├── courses/
│   │   │   ├── users/
│   │   │   └── reports/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/                 # shadcn/ui
│   │   ├── player/             # Video.js wrapper
│   │   ├── catalog/            # Cards, grids
│   │   └── layout/             # Header, sidebar
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useProgress.ts
│   │   └── useCatalog.ts
│   ├── lib/
│   │   ├── api.ts              # Axios/fetch client
│   │   ├── auth.ts             # NextAuth config
│   │   └── xapi.ts             # xAPI builder
│   └── styles/
├── public/
├── next.config.js
└── package.json
```

**Tecnologias:**
- Next.js 14 com App Router
- TypeScript 5
- Tailwind CSS 3
- shadcn/ui (componentes)
- React Query (TanStack Query)
- Video.js + VHS (HLS)
- NextAuth.js (OIDC com Keycloak)

---

### 2. NestJS API (Backend)

**Responsabilidades:**
- Autenticação e autorização
- CRUD de recursos (courses, lessons, etc.)
- Proxy para xAPI (Learning Locker)
- Upload de arquivos (signed URLs)
- Emissão de jobs para worker

**Estrutura interna:**
```
apps/api/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── guards/
│   │   │   │   ├── jwt.guard.ts
│   │   │   │   └── roles.guard.ts
│   │   │   └── strategies/
│   │   │       └── jwt.strategy.ts
│   │   ├── courses/
│   │   │   ├── courses.module.ts
│   │   │   ├── courses.controller.ts
│   │   │   ├── courses.service.ts
│   │   │   └── dto/
│   │   ├── lessons/
│   │   ├── progress/
│   │   │   ├── progress.controller.ts
│   │   │   ├── progress.service.ts
│   │   │   └── dto/
│   │   │       ├── heartbeat.dto.ts
│   │   │       └── complete.dto.ts
│   │   ├── tracks/
│   │   ├── enrollments/
│   │   ├── xapi/
│   │   │   ├── xapi.module.ts
│   │   │   ├── xapi.controller.ts
│   │   │   ├── xapi.service.ts
│   │   │   └── outbox.processor.ts
│   │   ├── upload/
│   │   │   ├── upload.controller.ts
│   │   │   └── upload.service.ts
│   │   ├── users/
│   │   └── franchises/
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   └── franchise.decorator.ts
│   │   ├── filters/
│   │   ├── interceptors/
│   │   └── pipes/
│   ├── config/
│   │   ├── database.config.ts
│   │   ├── redis.config.ts
│   │   └── r2.config.ts
│   ├── app.module.ts
│   └── main.ts
├── test/
├── prisma/
│   └── schema.prisma
└── package.json
```

**Tecnologias:**
- NestJS 10
- TypeScript 5
- Prisma ORM
- Passport.js (JWT)
- BullMQ (producer)
- class-validator/class-transformer

---

### 3. NestJS Worker (Processamento)

**Responsabilidades:**
- Processamento de vídeo (FFmpeg → HLS)
- Envio de xAPI em batch
- Geração de relatórios
- Envio de notificações

**Estrutura interna:**
```
apps/worker/
├── src/
│   ├── processors/
│   │   ├── video.processor.ts      # FFmpeg transcoding
│   │   ├── xapi-outbox.processor.ts # Envio ao LRS
│   │   └── report.processor.ts
│   ├── services/
│   │   ├── ffmpeg.service.ts
│   │   ├── r2.service.ts
│   │   └── lrs.service.ts
│   ├── config/
│   ├── app.module.ts
│   └── main.ts
└── package.json
```

**Tecnologias:**
- NestJS 10
- BullMQ (consumer)
- fluent-ffmpeg
- AWS SDK (S3 compatible para R2)

---

### 4. Keycloak (Autenticação)

**Responsabilidades:**
- Gestão de identidades
- Login/logout
- Recuperação de senha
- SSO entre aplicações
- Federação com Active Directory (futuro)

**Configuração do Realm:**
```
Realm: motochefe
├── Clients
│   ├── web-portal (public, PKCE)
│   └── api-backend (confidential)
├── Roles
│   ├── super_admin
│   ├── franchise_admin
│   ├── store_manager
│   └── learner
├── User Attributes
│   ├── franchise_id
│   ├── store_id
│   └── cargo
├── Client Scopes
│   └── motochefe-scope (mapeia franchise_id, cargo)
└── Authentication Flows
    └── browser (com OTP opcional)
```

---

### 5. PostgreSQL (Banco de Dados)

**Modelo de Dados:**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DATABASE SCHEMA                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                     │
│  │  franchises  │────▶│    stores    │────▶│    users     │                     │
│  └──────────────┘     └──────────────┘     └──────────────┘                     │
│         │                                         │                              │
│         │                                         │                              │
│         ▼                                         ▼                              │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                     │
│  │   courses    │────▶│   modules    │────▶│   lessons    │                     │
│  └──────────────┘     └──────────────┘     └──────────────┘                     │
│         │                                         │                              │
│         │                                         │                              │
│         ▼                                         ▼                              │
│  ┌──────────────┐                          ┌──────────────┐                     │
│  │ enrollments  │                          │lesson_progress│                    │
│  └──────────────┘                          └──────────────┘                     │
│         │                                                                        │
│         ▼                                                                        │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                     │
│  │    tracks    │────▶│ track_items  │     │    badges    │                     │
│  └──────────────┘     └──────────────┘     └──────────────┘                     │
│                                                   │                              │
│                                                   ▼                              │
│                                            ┌──────────────┐                     │
│                                            │ badge_awards │                     │
│                                            └──────────────┘                     │
│                                                                                  │
│  ┌──────────────┐                                                                │
│  │events_outbox │  (Para retry e auditoria xAPI)                                │
│  └──────────────┘                                                                │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

### 6. Redis (Cache e Filas)

**Uso:**
- Cache de sessão (tokens)
- Rate limiting
- Filas BullMQ
- Pub/sub para real-time

**Filas BullMQ:**
```
video-processing     # Transcodificação de vídeos
xapi-outbox          # Envio de statements ao LRS
notifications        # Push/email notifications
reports              # Geração de relatórios
```

---

### 7. Cloudflare R2 (Storage)

**Estrutura de buckets:**
```
motochefe-videos/
├── originals/              # Vídeos originais (upload)
│   └── {uploadId}.{ext}
├── videos/                 # HLS processados
│   └── {courseId}/{lessonId}/v{version}/
│       ├── master.m3u8
│       ├── 360p/
│       ├── 480p/
│       ├── 720p/
│       └── thumb.jpg
└── documents/              # PDFs, apresentações
    └── {courseId}/{lessonId}/
```

---

### 8. Learning Locker (LRS)

**Propósito:**
- Armazenar xAPI statements
- Fornecer dados para analytics
- Compliance e auditoria

**Integração:**
```
API → POST /xapi/statements
    → Salva em events_outbox (PostgreSQL)
    → Worker processa e envia ao LRS
    → Marca como sent ou failed
    → Retry exponencial em caso de falha
```

---

### 9. Metabase (BI)

**Conexões:**
- PostgreSQL (dados operacionais)
- MongoDB do Learning Locker (xAPI)

**Dashboards principais:**
1. **Visão Geral** - KPIs gerais
2. **Por Franquia** - Comparativo
3. **Por Curso** - Engajamento
4. **Por Usuário** - Individual
5. **Compliance** - Treinamentos obrigatórios

---

## Comunicação entre Serviços

### Fluxo de Autenticação

```
1. Web → Keycloak: Redirect para login
2. Keycloak → Web: Auth code
3. Web → Keycloak: Exchange code → tokens
4. Web → API: Request + Bearer token
5. API: Valida JWT com JWKS do Keycloak
6. API: Extrai claims (franchise_id, roles)
7. API: Aplica guards e retorna dados
```

### Fluxo de Upload de Vídeo

```
1. Web → API: Solicita signed URL
2. API → R2: Gera presigned PUT URL
3. API → Web: Retorna URL
4. Web → R2: Upload direto
5. Web → API: Notifica conclusão
6. API → Redis: Enfileira job
7. Worker ← Redis: Consome job
8. Worker → R2: Download original
9. Worker: FFmpeg transcoding
10. Worker → R2: Upload HLS
11. Worker → PostgreSQL: Atualiza metadata
```

### Fluxo de xAPI

```
1. Player: Evento de vídeo
2. Web → API: POST /xapi/statements
3. API: Valida e enriquece statement
4. API → PostgreSQL: Salva em outbox
5. API → Web: 202 Accepted
6. Worker ← PostgreSQL: Poll outbox
7. Worker → Learning Locker: POST /statements
8. Worker → PostgreSQL: Marca como sent
```

---

## Considerações de Escalabilidade

### Horizontal Scaling

- **Web**: Stateless, escala com replicas
- **API**: Stateless, escala com replicas
- **Worker**: Escala por número de filas

### Bottlenecks Potenciais

1. **FFmpeg**: CPU-intensive → Workers dedicados
2. **PostgreSQL**: Read replicas para queries
3. **Redis**: Cluster para alta disponibilidade
4. **R2**: CDN para distribuição

### Caching Strategy

```
Layer 1: Browser cache (assets)
Layer 2: CDN (Cloudflare) - vídeos, imagens
Layer 3: Redis - sessões, rate limits
Layer 4: Application - React Query
```

---

## Monitoramento

### Métricas Chave

- Request latency (p50, p95, p99)
- Error rate
- Queue depth (BullMQ)
- Video processing time
- xAPI delivery success rate

### Logs

- Structured logging (JSON)
- Correlation IDs
- Request tracing

### Alertas

- API errors > 1%
- Queue depth > 1000
- Video processing > 10min
- LRS failures > 5
