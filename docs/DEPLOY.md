# Deploy - Universidade MotoChefe LMS

## Servidor

- **IP:** 93.127.211.241
- **User:** root
- **Senha:** Motochefe2025@
- **Diretorio do projeto:** `/var/www/lms`
- **Gerenciador de processos:** PM2
- **Dominio:** universidademotochefe.com.br (HTTPS)

## Stack em producao

| Servico   | Porta | Processo PM2 | Container Docker |
|-----------|-------|--------------|------------------|
| API (NestJS) | 4001 | lms-api | — |
| Web (Next.js) | 3001 | lms-web | — |
| Nginx (proxy) | 80/443 | systemd | — |
| PostgreSQL | 5433 | — | motochefe-postgres |
| Redis | 6380 | — | motochefe-redis |
| Jitsi Web | 8443 | — | motochefe-jitsi-web |
| Jitsi XMPP | 5222/5280 | — | motochefe-jitsi-xmpp |
| Jitsi Jicofo | — | — | motochefe-jitsi-jicofo |
| Jitsi JVB | 10000/udp | — | motochefe-jitsi-jvb |

**Dominio Jitsi:** meet.universidademotochefe.com.br

---

## REGRAS CRITICAS

### 1. NUNCA sobrescrever o .env do servidor

O arquivo `.env` do servidor tem credenciais de producao diferentes do local:

| Variavel | Local (dev) | Producao |
|----------|------------|----------|
| `DATABASE_URL` | `motochefe:motochefe123@localhost:5433/lms_app` | `motochefe:Motochefe2025Prod!@localhost:5433/universidade` |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4001` | `https://universidademotochefe.com.br/api` |
| `NEXTAUTH_URL` | `http://localhost:3000` | `https://universidademotochefe.com.br` |

**Ao usar rsync, SEMPRE use `--exclude .env --exclude .env.local`.**

### 2. NEXT_PUBLIC_API_URL e variavel de build time

`NEXT_PUBLIC_*` sao embutidas no JavaScript durante o `next build`. Se voce fizer o build no Mac local e enviar os arquivos, o browser vai chamar `http://localhost:4001` ao inves do dominio.

**Regra: SEMPRE fazer o build do frontend NO SERVIDOR, nunca enviar a pasta `.next` pronta.**

### 3. Prisma engine e binarios de plataforma

O Prisma gera binarios nativos para a plataforma. Se voce copiar `node_modules` do macOS para Linux, o Prisma vai crashar com `insufficient data left in message`.

**Regra: Rodar `pnpm install` e `prisma generate` NO SERVIDOR.**

### 4. Permissoes de arquivo (403 no Nginx)

O rsync copia permissoes do macOS (700) que bloqueiam o Nginx (www-data). Apos todo deploy, corrigir permissoes:

```bash
chmod 755 /var/www/lms /var/www/lms/apps /var/www/lms/apps/web /var/www/lms/apps/web/public
chmod -R a+rX /var/www/lms/apps/web/public/uploads
```

### 5. Symlink do .env da API

A API le o `.env` de `apps/api/.env` que e um symlink para `/var/www/lms/.env`. O rsync pode quebrar esse symlink. Verificar apos deploy:

```bash
ls -la /var/www/lms/apps/api/.env
# Deve mostrar: .env -> /var/www/lms/.env

# Se estiver quebrado, recriar:
ln -sf /var/www/lms/.env /var/www/lms/apps/api/.env
```

---

## Deploy Completo (passo a passo seguro)

### Do computador local:

```bash
# 1. Sincronizar arquivos (SEM .env, SEM node_modules, SEM .next, SEM dist)
rsync -avz --delete \
  --exclude node_modules \
  --exclude .git \
  --exclude .env \
  --exclude .env.local \
  --exclude .next \
  --exclude dist \
  /Volumes/RAFAEL-SSD/LMS/ \
  root@93.127.211.241:/var/www/lms/
```

### No servidor (SSH):

```bash
ssh root@93.127.211.241
# Senha: Motochefe2025@

cd /var/www/lms

# 2. Verificar symlink do .env da API
ls -la apps/api/.env
# Se quebrado: ln -sf /var/www/lms/.env apps/api/.env

# 3. Instalar dependencias (gera binarios nativos para Linux)
pnpm install

# 4. Gerar Prisma client (binarios Linux)
pnpm --filter api exec prisma generate

# 5. Build da API
pnpm --filter api build

# 6. Build do frontend (com variaveis de producao)
NEXT_PUBLIC_API_URL=https://universidademotochefe.com.br/api pnpm --filter web build

# 7. Reiniciar servicos
pm2 restart lms-api lms-web

# 8. Corrigir permissoes para Nginx
chmod 755 /var/www/lms /var/www/lms/apps /var/www/lms/apps/web /var/www/lms/apps/web/public
chmod -R a+rX /var/www/lms/apps/web/public/uploads

# 9. Verificar status
pm2 status
pm2 logs --lines 20 --nostream
```

### Verificacao pos-deploy:

```bash
# API respondendo?
curl -s -o /dev/null -w "%{http_code}" http://localhost:4001/api/settings
# Deve retornar: 200

# Frontend respondendo?
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001
# Deve retornar: 200

# Verificar se nao esta em crash loop
pm2 status
# Coluna "uptime" deve ser crescente, nao "0s" repetido
```

---

## Deploy Rapido (uma linha)

### Somente API (mudancas no backend):

```bash
# No local:
rsync -avz --delete --exclude node_modules --exclude .git --exclude .env \
  /Volumes/RAFAEL-SSD/LMS/apps/api/ root@93.127.211.241:/var/www/lms/apps/api/

# No servidor:
cd /var/www/lms && pnpm --filter api exec prisma generate && pnpm --filter api build && pm2 restart lms-api
```

### Somente Frontend (mudancas no frontend):

```bash
# No local:
rsync -avz --delete --exclude node_modules --exclude .git --exclude .env --exclude .env.local --exclude .next \
  /Volumes/RAFAEL-SSD/LMS/apps/web/ root@93.127.211.241:/var/www/lms/apps/web/

# No servidor:
cd /var/www/lms && NEXT_PUBLIC_API_URL=https://universidademotochefe.com.br/api pnpm --filter web build && pm2 restart lms-web && chmod 755 /var/www/lms/apps/web/public && chmod -R a+rX /var/www/lms/apps/web/public/uploads
```

### Schema do banco mudou (migrations):

```bash
# No servidor, apos atualizar os arquivos:
cd /var/www/lms
pnpm --filter api exec prisma db push
# Ou, para migrations formais:
pnpm --filter api exec prisma migrate deploy
```

---

## Conectar ao servidor

```bash
ssh root@93.127.211.241
# Senha: Motochefe2025@
```

## Nginx

O Nginx faz proxy reverso:
- `universidademotochefe.com.br` -> `localhost:3001` (Next.js)
- `universidademotochefe.com.br/api` -> `localhost:4001/api` (NestJS)
- `universidademotochefe.com.br/uploads/` -> `/var/www/lms/apps/web/public/uploads/` (estatico)
- NextAuth routes (`/api/auth/*`) -> `localhost:3001` (Next.js)

Configuracao: `/etc/nginx/sites-enabled/lms`

```bash
# Editar
nano /etc/nginx/sites-enabled/lms

# Testar configuracao
nginx -t

# Recarregar
systemctl reload nginx
```

## Variaveis de Ambiente

O `.env` principal fica em `/var/www/lms/.env` e a API usa via symlink.

**NUNCA editar o .env local e enviar para o servidor. Editar SOMENTE direto no servidor:**

```bash
nano /var/www/lms/.env
```

Variaveis criticas de producao:
```
DATABASE_URL=postgresql://motochefe:Motochefe2025Prod!@localhost:5433/universidade
NEXT_PUBLIC_API_URL=https://universidademotochefe.com.br/api
NEXTAUTH_URL=https://universidademotochefe.com.br
NEXTAUTH_SECRET=sua-chave-secreta-de-32-caracteres-ou-mais
JWT_SECRET=motochefe-jwt-secret-32-chars-minimum
```

## Logs

```bash
# Tempo real (todos)
pm2 logs

# API com mais linhas
pm2 logs lms-api --lines 100

# Frontend
pm2 logs lms-web --lines 100

# Apenas erros
pm2 logs lms-api --err --lines 50

# Limpar logs
pm2 flush
```

## Banco de dados

```bash
# Ver containers rodando
docker ps

# Acessar PostgreSQL direto
docker exec -it motochefe-postgres psql -U motochefe -d universidade

# Ver tabelas
\dt

# Ver estrutura de uma tabela
\d lessons

# Backup
docker exec motochefe-postgres pg_dump -U motochefe universidade > backup_$(date +%Y%m%d).sql

# Restaurar
docker exec -i motochefe-postgres psql -U motochefe universidade < backup.sql
```

## Troubleshooting

### API em crash loop (muitos restarts)
```bash
pm2 logs lms-api --err --lines 50

# Causas comuns:
# - .env com credenciais erradas -> verificar /var/www/lms/.env
# - Symlink quebrado -> ln -sf /var/www/lms/.env /var/www/lms/apps/api/.env
# - Prisma binarios errados -> pnpm --filter api exec prisma generate
# - Schema desatualizado -> pnpm --filter api exec prisma db push
```

### 403 Forbidden (uploads/video)
```bash
# Permissoes do macOS bloqueiam Nginx
chmod 755 /var/www/lms /var/www/lms/apps /var/www/lms/apps/web /var/www/lms/apps/web/public
chmod -R a+rX /var/www/lms/apps/web/public/uploads
```

### CORS / chamando localhost no browser
```bash
# O frontend foi buildado com NEXT_PUBLIC_API_URL errado
# Rebuild no servidor:
cd /var/www/lms
NEXT_PUBLIC_API_URL=https://universidademotochefe.com.br/api pnpm --filter web build
pm2 restart lms-web
```

### 401 Unauthorized em todas as chamadas
```bash
# Token JWT expirado ou sessao corrompida
# Solucao: usuario deve fazer logout e login novamente

# Se persistir, verificar JWT_SECRET no .env:
grep JWT_SECRET /var/www/lms/.env
```

### Porta em uso
```bash
lsof -i :3001
lsof -i :4001
```

### Limpar cache e rebuild completo
```bash
cd /var/www/lms
rm -rf apps/web/.next apps/api/dist
pnpm install
pnpm --filter api exec prisma generate
pnpm --filter api build
NEXT_PUBLIC_API_URL=https://universidademotochefe.com.br/api NEXT_PUBLIC_JITSI_DOMAIN=meet.universidademotochefe.com.br pnpm --filter web build
pm2 restart lms-api lms-web
chmod 755 /var/www/lms /var/www/lms/apps /var/www/lms/apps/web /var/www/lms/apps/web/public
chmod -R a+rX /var/www/lms/apps/web/public/uploads
```

---

## Jitsi Meet Self-Hosted (Videoconferencia)

### Pre-requisitos

1. **DNS**: Criar registro A `meet.universidademotochefe.com.br → 93.127.211.241`
2. **Firewall**: Liberar porta `10000/udp` (trafego WebRTC de video)
3. **RAM**: Pelo menos 4GB livres no servidor

### Setup inicial (uma vez)

```bash
cd /var/www/lms/infra/jitsi

# Roda setup (gera segredos, cria diretorios)
chmod +x setup.sh
./setup.sh

# Confirma .env (IP e dominio)
nano .env
# PUBLIC_URL=https://meet.universidademotochefe.com.br
# JVB_ADVERTISE_IPS=93.127.211.241

# Configura Nginx
sudo cp nginx-jitsi.conf /etc/nginx/sites-available/jitsi
sudo ln -s /etc/nginx/sites-available/jitsi /etc/nginx/sites-enabled/jitsi

# Gera certificado SSL
sudo certbot certonly --nginx -d meet.universidademotochefe.com.br

# Testa Nginx
sudo nginx -t && sudo systemctl reload nginx

# Libera porta de video no firewall
sudo ufw allow 10000/udp

# Sobe os containers
docker compose -f docker-compose.jitsi.yml up -d
```

### Verificar se esta rodando

```bash
# Logs
docker compose -f docker-compose.jitsi.yml logs -f

# Status dos containers
docker compose -f docker-compose.jitsi.yml ps

# Teste no browser: abrir https://meet.universidademotochefe.com.br
```

### Comandos uteis

```bash
# Reiniciar Jitsi
cd /var/www/lms/infra/jitsi
docker compose -f docker-compose.jitsi.yml restart

# Parar Jitsi
docker compose -f docker-compose.jitsi.yml down

# Atualizar imagens
docker compose -f docker-compose.jitsi.yml pull
docker compose -f docker-compose.jitsi.yml up -d
```

### Variavel no frontend

O frontend usa `NEXT_PUBLIC_JITSI_DOMAIN` para saber qual servidor Jitsi conectar.
Em producao, deve apontar para o self-hosted:

```bash
# No .env do servidor, adicionar:
NEXT_PUBLIC_JITSI_DOMAIN=meet.universidademotochefe.com.br

# Rebuild do frontend com a variavel:
cd /var/www/lms
NEXT_PUBLIC_API_URL=https://universidademotochefe.com.br/api \
NEXT_PUBLIC_JITSI_DOMAIN=meet.universidademotochefe.com.br \
pnpm --filter web build
pm2 restart lms-web
```
