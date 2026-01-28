# Decisões de Arquitetura (ADRs)

Este documento registra as decisões técnicas importantes do projeto Universidade MotoChefe.

---

## ADR-001: Keycloak para Autenticação

**Status:** Aceito
**Data:** 2024-01-XX
**Contexto:** Precisamos de um sistema de autenticação robusto com login próprio, gestão de usuários, recuperação de senha e suporte a SSO.

**Decisão:** Usar Keycloak como Identity Provider (IdP) via OIDC.

**Alternativas consideradas:**
1. **Auth0** - SaaS, custo por usuário, vendor lock-in
2. **Firebase Auth** - Limitado em customização, vendor lock-in
3. **Implementação própria** - Alto risco, tempo de desenvolvimento
4. **Keycloak** - Open source, feature-complete, self-hosted

**Justificativa:**
- Open source e self-hosted (controle total)
- Suporte nativo a OIDC/OAuth2/SAML
- UI de admin para gestão de usuários
- Federação com AD/LDAP (futuro)
- Themes customizáveis
- Comunidade ativa

**Consequências:**
- (+) Controle total sobre dados de usuários
- (+) Sem custo por usuário
- (+) Flexibilidade de customização
- (-) Infraestrutura para manter
- (-) Curva de aprendizado

---

## ADR-002: Learning Locker para xAPI

**Status:** Aceito
**Data:** 2024-01-XX
**Contexto:** Precisamos armazenar eventos de aprendizado (xAPI statements) para analytics e compliance.

**Decisão:** Usar Learning Locker como Learning Record Store (LRS).

**Alternativas consideradas:**
1. **Watershed LRS** - SaaS pago, custo elevado
2. **SCORM Cloud** - Focado em SCORM, não em xAPI nativo
3. **Implementação própria** - Complexidade da spec xAPI
4. **Learning Locker** - Open source, spec-compliant

**Justificativa:**
- Open source e self-hosted
- Totalmente compatível com xAPI spec
- API bem documentada
- Suporta aggregation queries
- Pode conectar ao Metabase

**Consequências:**
- (+) Compliance com xAPI
- (+) Dados de aprendizado ricos
- (+) Analytics avançados
- (-) MongoDB como dependência adicional
- (-) Configuração inicial complexa

---

## ADR-003: Cloudflare R2 para Storage

**Status:** Aceito
**Data:** 2024-01-XX
**Contexto:** Precisamos armazenar vídeos (originais e HLS) de forma escalável e econômica.

**Decisão:** Usar Cloudflare R2 com CDN integrado.

**Alternativas consideradas:**
1. **AWS S3 + CloudFront** - Custo de egress alto
2. **Google Cloud Storage** - Similar ao S3
3. **Backblaze B2** - Barato, mas CDN separado
4. **Cloudflare R2** - Zero egress, S3 compatible

**Justificativa:**
- **Zero egress fees** - crucial para streaming de vídeo
- S3-compatible API (fácil migração)
- CDN Cloudflare integrado
- Workers para lógica no edge
- Custo competitivo de storage

**Consequências:**
- (+) Custo previsível (sem surpresas de egress)
- (+) Performance global via CDN
- (+) Pode usar AWS SDK
- (-) Menos features que S3 (lifecycle limitado)
- (-) Menor ecossistema de ferramentas

---

## ADR-004: HLS para Streaming de Vídeo

**Status:** Aceito
**Data:** 2024-01-XX
**Contexto:** Precisamos entregar vídeos com adaptive bitrate e compatibilidade ampla.

**Decisão:** Usar HLS (HTTP Live Streaming) gerado por FFmpeg.

**Alternativas consideradas:**
1. **DASH** - Menos suporte em Safari
2. **Progressive download** - Sem adaptive bitrate
3. **WebRTC** - Overkill para VOD
4. **HLS** - Suporte universal

**Justificativa:**
- Suporte nativo em Safari/iOS
- hls.js para outros browsers
- Adaptive bitrate automático
- Cacheable via CDN
- FFmpeg gera facilmente

**Variantes de qualidade:**
- 360p (600kbps) - mobile/low bandwidth
- 480p (1200kbps) - standard
- 720p (2500kbps) - HD

**Consequências:**
- (+) Funciona em todos os devices
- (+) Experiência adaptativa
- (+) Eficiente para CDN
- (-) Tempo de processamento inicial
- (-) Mais storage (múltiplas variantes)

---

## ADR-005: NestJS para Backend

**Status:** Aceito
**Data:** 2024-01-XX
**Contexto:** Precisamos de um framework backend robusto, tipado e com boa DX.

**Decisão:** Usar NestJS com TypeScript.

**Alternativas consideradas:**
1. **Express.js** - Muito baixo nível, sem estrutura
2. **Fastify** - Performance, mas menos features
3. **AdonisJS** - Menos adoção no mercado
4. **NestJS** - Estruturado, enterprise-ready

**Justificativa:**
- Arquitetura modular (modules, controllers, services)
- Injeção de dependência nativa
- TypeScript first
- Decorators para auth, validation
- Excelente para APIs REST e microservices
- Suporte a BullMQ integrado

**Consequências:**
- (+) Código organizado e testável
- (+) Grande ecossistema
- (+) Familiar para devs Angular
- (-) Boilerplate inicial
- (-) Curva de aprendizado para decorators

---

## ADR-006: Prisma como ORM

**Status:** Aceito
**Data:** 2024-01-XX
**Contexto:** Precisamos de um ORM type-safe para PostgreSQL.

**Decisão:** Usar Prisma ORM.

**Alternativas consideradas:**
1. **TypeORM** - Bugs, manutenção irregular
2. **Sequelize** - API antiga, tipagem fraca
3. **Drizzle** - Novo, menos maduro
4. **Knex** - Query builder apenas
5. **Prisma** - Type-safe, migrations, studio

**Justificativa:**
- Schema declarativo
- Migrations automáticas
- Client 100% type-safe
- Prisma Studio para debug
- Excelente DX

**Consequências:**
- (+) Zero erros de tipo em queries
- (+) Migrations versionadas
- (+) Prisma Studio
- (-) Overhead de client generation
- (-) Algumas queries avançadas são verbosas

---

## ADR-007: BullMQ para Filas

**Status:** Aceito
**Data:** 2024-01-XX
**Contexto:** Precisamos de filas para processamento assíncrono (vídeos, xAPI, emails).

**Decisão:** Usar BullMQ com Redis.

**Alternativas consideradas:**
1. **RabbitMQ** - Mais complexo de operar
2. **AWS SQS** - Vendor lock-in
3. **Agenda** - Menos features
4. **BullMQ** - Redis-based, feature-rich

**Justificativa:**
- Redis já é usado para cache
- UI de dashboard (Bull Board)
- Retry, delay, priority nativas
- Rate limiting
- Integração NestJS oficial

**Consequências:**
- (+) Simples de operar (só Redis)
- (+) Features ricas
- (+) UI de monitoramento
- (-) Redis como SPOF
- (-) Persistência limitada vs RabbitMQ

---

## ADR-008: Next.js com App Router

**Status:** Aceito
**Data:** 2024-01-XX
**Contexto:** Precisamos de um framework React com SSR, routing e boa DX.

**Decisão:** Usar Next.js 14 com App Router.

**Alternativas consideradas:**
1. **Create React App** - Sem SSR, deprecated
2. **Vite + React** - Sem SSR nativo
3. **Remix** - Menos adoção
4. **Next.js** - Líder de mercado

**Justificativa:**
- SSR/SSG para performance
- App Router para layouts
- Server Components
- API Routes (fallback)
- Vercel deploy simples

**Consequências:**
- (+) Performance otimizada
- (+) Grande comunidade
- (+) Fácil deploy
- (-) Lock-in em algumas features
- (-) Complexidade do App Router

---

## ADR-009: Proxy xAPI via API

**Status:** Aceito
**Data:** 2024-01-XX
**Contexto:** Não podemos expor credenciais do LRS no browser.

**Decisão:** Criar endpoint proxy POST /xapi/statements na API.

**Alternativas consideradas:**
1. **xAPI direto do browser** - Expõe credenciais
2. **Cloudflare Worker** - Mais complexidade
3. **API Proxy** - Seguro, controle total

**Justificativa:**
- Credenciais ficam no backend
- Podemos enriquecer statements
- Controle de rate limit
- Outbox pattern para reliability

**Consequências:**
- (+) Segurança
- (+) Controle
- (+) Retry automático
- (-) Latência adicional
- (-) Mais código para manter

---

## ADR-010: Outbox Pattern para xAPI

**Status:** Aceito
**Data:** 2024-01-XX
**Contexto:** Precisamos garantir que statements xAPI sejam entregues mesmo em falhas.

**Decisão:** Implementar outbox pattern com tabela events_outbox.

**Fluxo:**
1. API recebe statement
2. Salva em events_outbox com status=pending
3. Retorna 202 Accepted
4. Worker processa outbox periodicamente
5. Envia ao LRS
6. Atualiza status para sent ou failed
7. Retry com backoff exponencial

**Justificativa:**
- Garantia de entrega
- Auditoria de eventos
- Resiliência a falhas do LRS
- Pode reprocessar em caso de bug

**Consequências:**
- (+) At-least-once delivery
- (+) Auditoria completa
- (+) Resiliência
- (-) Complexidade adicional
- (-) Possível duplicação (idempotência necessária)

---

## ADR-011: Metabase para BI

**Status:** Aceito
**Data:** 2024-01-XX
**Contexto:** Precisamos de dashboards e relatórios para gestão.

**Decisão:** Usar Metabase self-hosted.

**Alternativas consideradas:**
1. **Power BI** - Custo, Windows-centric
2. **Looker** - Custo elevado
3. **Grafana** - Mais ops-focused
4. **Superset** - Complexo
5. **Metabase** - Simples, self-hosted

**Justificativa:**
- Open source
- UI intuitiva
- SQL nativo
- Embeddable
- Alertas

**Consequências:**
- (+) Fácil de usar
- (+) Self-hosted
- (+) Dashboards embeddáveis
- (-) Menos features que enterprise
- (-) Escala limitada

---

## Template para Novas Decisões

```markdown
## ADR-XXX: [Título]

**Status:** Proposto | Aceito | Deprecado | Substituído
**Data:** YYYY-MM-DD
**Contexto:** [Qual problema estamos resolvendo?]

**Decisão:** [O que decidimos fazer?]

**Alternativas consideradas:**
1. **[Opção A]** - [Prós e contras]
2. **[Opção B]** - [Prós e contras]

**Justificativa:** [Por que esta decisão?]

**Consequências:**
- (+) [Benefício]
- (-) [Trade-off]
```
