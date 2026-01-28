# @motochefe/web

Portal web da Universidade MotoChefe construído com Next.js.

## Tecnologias

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Video.js (player)
- NextAuth.js (autenticação)
- TanStack Query (data fetching)

## Páginas

- `/login` - Login via Keycloak
- `/catalog` - Catálogo de cursos
- `/courses/[id]` - Detalhes do curso
- `/player/[lessonId]` - Player de vídeo
- `/tracks` - Trilhas de aprendizado
- `/profile` - Perfil e progresso

## Componentes Principais

- `VideoPlayer` - Player Video.js com HLS e tracking
- `CourseCard` - Card de curso estilo Netflix
- `ContinueWatching` - Seção de continuar assistindo
- `Header` / `Sidebar` - Layout do portal

## Scripts

```bash
# Desenvolvimento
pnpm dev

# Build
pnpm build

# Start produção
pnpm start

# Lint
pnpm lint
```

## Variáveis de Ambiente

Veja `.env.example` na raiz do monorepo.

Principais:
- `NEXT_PUBLIC_API_URL` - URL da API
- `NEXTAUTH_URL` - URL do portal
- `NEXTAUTH_SECRET` - Secret do NextAuth
- `KEYCLOAK_*` - Configurações do Keycloak
