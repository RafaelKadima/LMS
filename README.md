# Universidade MotoChefe - LXP/LMS Corporativo

> Portal "Netflix corporativo" para capacitação de franquias MotoChefe

## Visão Geral

A **Universidade MotoChefe** é uma plataforma de aprendizado corporativo (LXP - Learning Experience Platform) com LMS integrado, projetada para atender **60+ franquias** e aproximadamente **300 usuários**.

### Por que este sistema existe?

1. **Experiência Netflix**: Interface moderna com catálogo visual, busca inteligente, trilhas de aprendizado, "continue assistindo" e autoplay
2. **Controle total**: Login próprio via Keycloak, conteúdo 100% próprio hospedado no Cloudflare R2
3. **Tracking real**: Rastreamento preciso de progresso (play/pause/seek/tempo assistido) via xAPI
4. **Multi-franquia**: Segregação por franchise_id, loja e cargo com permissões granulares
5. **BI integrado**: Dashboards e exportações via Metabase

---

## Arquitetura de Alto Nível

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              UNIVERSIDADE MOTOCHEFE                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                     │
│  │   Browser    │────▶│   Next.js    │────▶│   NestJS     │                     │
│  │   (Portal)   │     │   (Web)      │     │   (API)      │                     │
│  │              │     │   :3000      │     │   :4000      │                     │
│  └──────────────┘     └──────────────┘     └──────┬───────┘                     │
│         │                                         │                              │
│         │ HLS Stream                              │                              │
│         ▼                                         ▼                              │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                     │
│  │ Cloudflare   │     │   Keycloak   │     │  PostgreSQL  │                     │
│  │ R2 + CDN     │     │   (Auth)     │     │   (Data)     │                     │
│  │              │     │   :8080      │     │   :5432      │                     │
│  └──────────────┘     └──────────────┘     └──────────────┘                     │
│                                                   │                              │
│                              ┌────────────────────┼────────────────────┐        │
│                              │                    │                    │        │
│                              ▼                    ▼                    ▼        │
│                       ┌──────────────┐     ┌──────────────┐     ┌──────────────┐│
│                       │    Redis     │     │   Worker     │     │   Learning   ││
│                       │   + BullMQ   │     │   (FFmpeg)   │     │   Locker     ││
│                       │   :6379      │     │              │     │   (LRS)      ││
│                       └──────────────┘     └──────────────┘     └──────────────┘│
│                                                                        │        │
│                                                                        ▼        │
│                                                                 ┌──────────────┐│
│                                                                 │   Metabase   ││
│                                                                 │   (BI)       ││
│                                                                 │   :3001      ││
│                                                                 └──────────────┘│
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Componentes do Sistema

| Componente | Tecnologia | Porta | Responsabilidade |
|------------|------------|-------|------------------|
| **Web** | Next.js 14 (App Router) | 3000 | Portal do aluno/admin, UI Netflix-like |
| **API** | NestJS | 4000 | Backend REST, autenticação, proxy xAPI |
| **Worker** | NestJS + BullMQ | - | Processamento de vídeo (FFmpeg → HLS) |
| **Auth** | Keycloak | 8080 | OIDC/OAuth2, gestão de usuários |
| **Database** | PostgreSQL 15 | 5432 | Dados persistentes |
| **Cache/Queue** | Redis 7 | 6379 | Cache, filas BullMQ |
| **Storage** | Cloudflare R2 | - | Vídeos originais e HLS |
| **LRS** | Learning Locker | 8081 | Armazenamento xAPI statements |
| **BI** | Metabase | 3001 | Dashboards e relatórios |

---

## Fluxos Principais

### A) Login OIDC (Keycloak → Web → API)

```
┌────────┐     ┌────────┐     ┌──────────┐     ┌────────┐
│ Usuário│────▶│  Web   │────▶│ Keycloak │────▶│  API   │
└────────┘     └────────┘     └──────────┘     └────────┘
     │              │               │               │
     │ 1. Clica     │               │               │
     │    Login     │               │               │
     │──────────────▶               │               │
     │              │ 2. Redirect   │               │
     │              │    /auth      │               │
     │              │──────────────▶│               │
     │              │               │ 3. Login form │
     │◀─────────────────────────────│               │
     │ 4. Credenciais               │               │
     │──────────────────────────────▶               │
     │              │ 5. Auth code  │               │
     │              │◀──────────────│               │
     │              │ 6. Exchange   │               │
     │              │    code→token │               │
     │              │──────────────▶│               │
     │              │ 7. JWT tokens │               │
     │              │◀──────────────│               │
     │              │               │ 8. Validate   │
     │              │               │    JWT        │
     │              │               │──────────────▶│
     │              │               │               │
```

**Tokens retornados:**
- `access_token`: JWT com claims (sub, franchise_id, roles, cargo)
- `refresh_token`: Para renovação silenciosa
- `id_token`: Dados do usuário

### B) Upload de Vídeo → Processamento → HLS no R2

```
┌────────┐     ┌────────┐     ┌────────┐     ┌────────┐     ┌────────┐
│ Admin  │────▶│  Web   │────▶│  API   │────▶│ Worker │────▶│   R2   │
└────────┘     └────────┘     └────────┘     └────────┘     └────────┘
     │              │               │               │               │
     │ 1. Select    │               │               │               │
     │    video     │               │               │               │
     │──────────────▶               │               │               │
     │              │ 2. Request    │               │               │
     │              │    signed URL │               │               │
     │              │──────────────▶│               │               │
     │              │ 3. Signed URL │               │               │
     │              │◀──────────────│               │               │
     │ 4. Direct    │               │               │               │
     │    upload    │               │               │               │
     │──────────────────────────────────────────────────────────────▶│
     │              │               │               │               │
     │              │ 5. Notify     │               │               │
     │              │    complete   │               │               │
     │              │──────────────▶│               │               │
     │              │               │ 6. Queue job  │               │
     │              │               │──────────────▶│               │
     │              │               │               │ 7. Download   │
     │              │               │               │    original   │
     │              │               │               │◀──────────────│
     │              │               │               │ 8. FFmpeg     │
     │              │               │               │    transcode  │
     │              │               │               │    (HLS)      │
     │              │               │               │ 9. Upload     │
     │              │               │               │    HLS files  │
     │              │               │               │──────────────▶│
     │              │               │ 10. Update    │               │
     │              │               │     metadata  │               │
     │              │               │◀──────────────│               │
```

**Estrutura HLS no R2:**
```
videos/
└── {courseId}/
    └── {lessonId}/
        └── v{version}/
            ├── master.m3u8
            ├── 360p/
            │   ├── playlist.m3u8
            │   └── segment_*.ts
            ├── 480p/
            │   ├── playlist.m3u8
            │   └── segment_*.ts
            ├── 720p/
            │   ├── playlist.m3u8
            │   └── segment_*.ts
            └── thumb.jpg
```

### C) Playback → Progress Heartbeat → Conclusão

```
┌────────┐     ┌────────┐     ┌────────┐     ┌────────┐
│ Player │────▶│  Web   │────▶│  API   │────▶│   DB   │
└────────┘     └────────┘     └────────┘     └────────┘
     │              │               │               │
     │ 1. Play      │               │               │
     │    event     │               │               │
     │──────────────▶               │               │
     │              │ 2. POST       │               │
     │              │    /heartbeat │               │
     │              │    (a cada    │               │
     │              │     5-10s)    │               │
     │              │──────────────▶│               │
     │              │               │ 3. UPSERT     │
     │              │               │    progress   │
     │              │               │──────────────▶│
     │              │               │               │
     │ ... (loop)   │               │               │
     │              │               │               │
     │ 4. Video     │               │               │
     │    ended     │               │               │
     │──────────────▶               │               │
     │              │ 5. POST       │               │
     │              │    /complete  │               │
     │              │──────────────▶│               │
     │              │               │ 6. Check      │
     │              │               │    >= 90%     │
     │              │               │──────────────▶│
     │              │               │ 7. Mark       │
     │              │               │    completed  │
     │              │               │──────────────▶│
```

**Payload do heartbeat:**
```json
{
  "lessonId": "uuid",
  "currentTime": 125.5,
  "duration": 600,
  "playbackRate": 1.0,
  "event": "playing"
}
```

### D) Emissão de xAPI Statements (Browser → API Proxy → Learning Locker)

```
┌────────┐     ┌────────┐     ┌────────┐     ┌──────────────┐
│ Player │────▶│  API   │────▶│ Outbox │────▶│Learning Locker│
└────────┘     └────────┘     └────────┘     └──────────────┘
     │              │               │               │
     │ 1. Video     │               │               │
     │    event     │               │               │
     │──────────────▶               │               │
     │              │ 2. Build      │               │
     │              │    statement  │               │
     │              │               │               │
     │              │ 3. Save to    │               │
     │              │    outbox     │               │
     │              │──────────────▶│               │
     │              │               │               │
     │              │ 4. (async)    │               │
     │              │    send to LRS│               │
     │              │               │──────────────▶│
     │              │               │ 5. Retry if   │
     │              │               │    failed     │
```

**Exemplo de xAPI Statement:**
```json
{
  "actor": {
    "mbox": "mailto:joao@franquia1.com",
    "name": "João Silva"
  },
  "verb": {
    "id": "https://w3id.org/xapi/video/verbs/played",
    "display": { "pt-BR": "reproduziu" }
  },
  "object": {
    "id": "https://motochefe.com/lessons/abc123",
    "definition": {
      "name": { "pt-BR": "Aula: Como montar um motor" },
      "type": "https://w3id.org/xapi/video/activity-type/video"
    }
  },
  "result": {
    "extensions": {
      "https://w3id.org/xapi/video/extensions/time": 125.5,
      "https://w3id.org/xapi/video/extensions/progress": 0.45
    }
  },
  "context": {
    "extensions": {
      "https://motochefe.com/franchise_id": "franchise-uuid",
      "https://motochefe.com/cargo": "mecanico"
    }
  }
}
```

### E) Dashboards no Metabase

O Metabase conecta diretamente ao PostgreSQL e ao MongoDB do Learning Locker para criar dashboards:

**Métricas principais:**
- Progresso por franquia/loja
- Cursos mais acessados
- Taxa de conclusão por cargo
- Tempo médio de conclusão
- Alunos em risco (sem acesso há X dias)
- Ranking de franquias

---

## Regras Multi-Franquia

### Segregação de Dados

Todo recurso de negócio possui `franchise_id`:

```sql
-- Exemplo de query com filtro automático
SELECT * FROM courses
WHERE franchise_id = :userFranchiseId
   OR franchise_id IS NULL; -- Conteúdo global
```

### Hierarquia de Permissões

```
SUPER_ADMIN (MotoChefe matriz)
    ├── Ver tudo
    ├── Criar conteúdo global
    └── Gerenciar franquias

FRANCHISE_ADMIN (Dono da franquia)
    ├── Ver dados da própria franquia
    ├── Criar conteúdo local
    └── Gerenciar lojas/usuários

STORE_MANAGER (Gerente de loja)
    ├── Ver dados da própria loja
    └── Acompanhar equipe

LEARNER (Colaborador)
    └── Ver próprio progresso
```

### Claims no JWT

```json
{
  "sub": "user-uuid",
  "franchise_id": "franchise-uuid",
  "store_id": "store-uuid",
  "cargo": "mecanico",
  "roles": ["learner"],
  "realm_access": {
    "roles": ["default-roles-motochefe"]
  }
}
```

---

## Política de Conclusão

### Regras para marcar aula como concluída:

1. **Vídeo assistido >= 90%** do tempo total
2. **Sem fast-forward excessivo**: Velocidade máxima 2x
3. **Quiz aprovado** (quando aplicável): >= 70% de acertos

### Cálculo do progresso real:

```typescript
// Não conta tempo em pause ou fora da aba
const realProgress = secondsWatched / videoDuration;

// Só completa se:
// - realProgress >= 0.9
// - Não pulou mais que 10% do vídeo
// - Quiz aprovado (se existir)
```

---

## Segurança

### Autenticação
- **JWT RS256** assinado pelo Keycloak
- **JWKS** para validação de assinatura
- **Refresh tokens** com rotação automática
- **Session timeout**: 8 horas (access), 30 dias (refresh)

### Autorização
- **RBAC** baseado em roles do Keycloak
- **ABAC** para recursos por franchise_id
- **Guards** no NestJS validam permissões

### Proteção de APIs
- **Rate limiting**: 100 req/min por usuário
- **CORS** restrito a domínios permitidos
- **Helmet** para headers de segurança
- **Validação** de DTOs com class-validator

### Proteção de Vídeos
- **Signed URLs** com expiração (1h)
- **Token no cookie** para validação no edge
- **Watermark** com ID do usuário (futuro)

---

## Quick Start

```bash
# 1. Clone o repositório
git clone https://github.com/motochefe/universidade.git
cd universidade

# 2. Instale dependências
pnpm install

# 3. Configure variáveis de ambiente
cp .env.example .env
# Edite o .env com suas configurações

# 4. Suba os serviços
docker compose up -d

# 5. Execute migrations e seeds
pnpm db:migrate
pnpm db:seed

# 6. Inicie o desenvolvimento
pnpm dev
```

---

## Estrutura do Projeto

```
universidade-motochefe/
├── apps/
│   ├── web/                 # Next.js - Portal
│   ├── api/                 # NestJS - Backend
│   └── worker/              # NestJS - Processamento
├── packages/
│   └── shared/              # Tipos e SDK compartilhados
├── infra/
│   ├── docker/              # docker-compose e Dockerfiles
│   ├── keycloak/            # Realm export
│   └── db/
│       ├── migrations/      # SQL migrations
│       └── seeds/           # Dados iniciais
├── docs/
│   ├── ARCHITECTURE.md      # Arquitetura detalhada
│   ├── DECISIONS.md         # ADRs (Architecture Decision Records)
│   └── CHANGELOG.md         # Histórico de mudanças
├── scripts/                 # Scripts utilitários
├── docker-compose.yml
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

---

## Links Úteis

- [Documentação de Arquitetura](./docs/ARCHITECTURE.md)
- [Decisões Técnicas (ADRs)](./docs/DECISIONS.md)
- [Changelog](./docs/CHANGELOG.md)
- [API Docs (Swagger)](http://localhost:4000/api/docs)
- [Keycloak Admin](http://localhost:8080/admin)
- [Metabase](http://localhost:3001)

---

## Licença

Propriedade de MotoChefe Franquias. Todos os direitos reservados.
