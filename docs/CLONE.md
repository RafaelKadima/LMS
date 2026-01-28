# Repositórios de Referência

Este documento lista os repositórios que devem ser clonados como **referência** para o desenvolvimento do projeto Universidade MotoChefe.

> **IMPORTANTE**: Esses repositórios são para **referência e estudo**. O código real do projeto é gerado via CLI (Next.js, NestJS) e desenvolvido customizado.

---

## Comandos para Clonar

Execute os comandos abaixo para criar uma pasta de referências:

```bash
# Criar pasta para referências
mkdir -p references && cd references

# ==========================================
# 1) AUTH - Keycloak
# ==========================================
# Servidor de identidade OIDC/OAuth2
git clone --depth 1 https://github.com/keycloak/keycloak.git
# Exemplos de integração
git clone --depth 1 https://github.com/keycloak/keycloak-quickstarts.git

# ==========================================
# 2) LRS xAPI - Learning Locker
# ==========================================
# Código do Learning Locker
git clone --depth 1 https://github.com/LearningLocker/learninglocker.git
# Scripts de deploy com Docker
git clone --depth 1 https://github.com/LearningLocker/deploy.git

# ==========================================
# 3) BI - Metabase
# ==========================================
# Plataforma de BI open source
git clone --depth 1 https://github.com/metabase/metabase.git

# ==========================================
# 4) Base da Stack
# ==========================================
# Framework React SSR (referência, usamos create-next-app)
git clone --depth 1 https://github.com/vercel/next.js.git
# Framework NestJS (referência, usamos @nestjs/cli)
git clone --depth 1 https://github.com/nestjs/nest.git
# Biblioteca de filas
git clone --depth 1 https://github.com/taskforcesh/bullmq.git

# ==========================================
# 5) Player / Streaming
# ==========================================
# Player de vídeo principal
git clone --depth 1 https://github.com/videojs/video.js.git
# Plugin HLS oficial do Video.js
git clone --depth 1 https://github.com/videojs/http-streaming.git
# Biblioteca HLS alternativa (fallback)
git clone --depth 1 https://github.com/video-dev/hls.js.git

# ==========================================
# 6) Referência Tracking xAPI Vídeo
# ==========================================
# Implementação de referência para xAPI + Video.js
git clone --depth 1 https://github.com/jhaag75/xapi-videojs.git

# ==========================================
# 7) (Opcional) Componentes OpenLXP
# ==========================================
# Experience Discovery Service
git clone --depth 1 https://github.com/OpenLXP/openlxp-xds.git
# Experience Search Engine
git clone --depth 1 https://github.com/OpenLXP/openlxp-xse.git
# Experience Management UI
git clone --depth 1 https://github.com/OpenLXP/openlxp-xms-ui.git

# Voltar para a raiz
cd ..
```

---

## Explicação de Cada Repositório

### Auth (Keycloak)

| Repositório | Finalidade |
|-------------|------------|
| `keycloak/keycloak` | Código fonte do Keycloak. Usar como referência para entender fluxos OIDC, themes e SPIs. |
| `keycloak/keycloak-quickstarts` | Exemplos de integração com Java, Node.js, React. Útil para entender como configurar clients. |

**Na prática**: Usamos a imagem Docker oficial do Keycloak (`quay.io/keycloak/keycloak`) e configuramos via realm export.

---

### LRS xAPI (Learning Locker)

| Repositório | Finalidade |
|-------------|------------|
| `LearningLocker/learninglocker` | Código do LRS. Útil para entender a API xAPI e estrutura de statements. |
| `LearningLocker/deploy` | Docker Compose pronto para subir Learning Locker com MongoDB e Redis. |

**Na prática**: Usamos o `deploy` para subir o Learning Locker em containers.

---

### BI (Metabase)

| Repositório | Finalidade |
|-------------|------------|
| `metabase/metabase` | Código do Metabase. Referência para entender embeds e API. |

**Na prática**: Usamos a imagem Docker oficial do Metabase.

---

### Base da Stack

| Repositório | Finalidade |
|-------------|------------|
| `vercel/next.js` | Código do Next.js. Referência para App Router, Server Components, etc. |
| `nestjs/nest` | Código do NestJS. Referência para patterns, decorators e modules. |
| `taskforcesh/bullmq` | Código do BullMQ. Referência para configurar filas e workers. |

**Na prática**:
- Next.js: `npx create-next-app@latest apps/web --typescript --tailwind --app`
- NestJS: `npm i -g @nestjs/cli && nest new apps/api`

---

### Player / Streaming

| Repositório | Finalidade |
|-------------|------------|
| `videojs/video.js` | Player de vídeo. Referência para API, plugins e themes. |
| `videojs/http-streaming` | Plugin VHS do Video.js para HLS/DASH. Já incluído no video.js moderno. |
| `video-dev/hls.js` | Biblioteca HLS standalone. Usar como fallback ou referência para debugging. |

**Na prática**: Instalamos `video.js` via npm e usamos o VHS integrado.

---

### xAPI Tracking

| Repositório | Finalidade |
|-------------|------------|
| `jhaag75/xapi-videojs` | Implementação de referência que mapeia eventos do Video.js para statements xAPI. |

**IMPORTANTE**: NÃO usamos esse código diretamente no frontend (exporia credenciais). Usamos como referência para:
1. Quais eventos capturar (play, pause, seek, ended)
2. Como estruturar os statements
3. Quais extensions usar

**Na prática**: Capturamos eventos no frontend e enviamos via `/api/xapi/statements` (proxy seguro).

---

### OpenLXP (Opcional)

| Repositório | Finalidade |
|-------------|------------|
| `OpenLXP/openlxp-xds` | Serviço de descoberta de experiências. Referência para catálogo. |
| `OpenLXP/openlxp-xse` | Motor de busca. Referência para Elasticsearch com LXP. |
| `OpenLXP/openlxp-xms-ui` | UI de gestão. Referência para admin panels. |

**Na prática**: Usamos apenas como inspiração para features futuras.

---

## Estrutura Após Clone

```
references/
├── keycloak/
├── keycloak-quickstarts/
├── learninglocker/
├── deploy/                 # Learning Locker deploy scripts
├── metabase/
├── next.js/
├── nest/
├── bullmq/
├── video.js/
├── http-streaming/
├── hls.js/
├── xapi-videojs/
├── openlxp-xds/
├── openlxp-xse/
└── openlxp-xms-ui/
```

---

## Dicas de Uso

### Buscar Exemplos de Código

```bash
# Buscar como NestJS implementa guards
grep -r "CanActivate" references/nest/packages

# Buscar como Video.js emite eventos
grep -r "trigger\|on\(" references/video.js/src

# Buscar statements xAPI de referência
grep -r "verb\|actor\|object" references/xapi-videojs
```

### Entender Configuração Keycloak

```bash
# Ver exemplos de realm config
cat references/keycloak-quickstarts/app-authz-rest-springboot/config/keycloak.json
```

### Rodar Learning Locker localmente

```bash
cd references/deploy
docker compose up -d
# Acesse http://localhost:3000 (Learning Locker UI)
```

---

## Atualizando Referências

Para atualizar as referências (pegar novas versões):

```bash
cd references
for dir in */; do
  echo "Updating $dir..."
  cd "$dir"
  git pull --rebase || echo "Failed to update $dir"
  cd ..
done
```

---

## Não Commitar Referências

Adicione ao `.gitignore`:

```
# References (cloned repos for study)
references/
```
