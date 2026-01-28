# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [Unreleased]

### Added
- Estrutura inicial do monorepo (apps/web, apps/api, apps/worker, packages/shared)
- Docker Compose com PostgreSQL, Redis, Keycloak, Learning Locker, Metabase
- Documentação de arquitetura (README, ARCHITECTURE, DECISIONS)
- Migrations iniciais do banco de dados
- Seeds com dados de exemplo (1 franquia, 2 cargos, 3 cursos, 6 aulas)

### Changed
- N/A

### Deprecated
- N/A

### Removed
- N/A

### Fixed
- N/A

### Security
- N/A

---

## [0.1.0] - 2024-XX-XX

### Added
- **Autenticação**
  - Login via Keycloak (OIDC)
  - Proteção de rotas (frontend e backend)
  - Refresh token automático

- **Catálogo**
  - Listagem de cursos
  - Filtro por categoria
  - Busca por título
  - Cards no estilo Netflix

- **Player de Vídeo**
  - Video.js com suporte HLS
  - Controles customizados
  - Qualidade adaptativa

- **Progresso**
  - Heartbeat a cada 5 segundos
  - Salvamento de posição
  - Marcação de conclusão (>= 90%)
  - Continue assistindo

- **xAPI**
  - Proxy seguro via API
  - Statements de play/pause/seek/complete
  - Outbox pattern com retry

---

## Convenções

### Tipos de Mudança

- **Added**: Novas funcionalidades
- **Changed**: Mudanças em funcionalidades existentes
- **Deprecated**: Funcionalidades que serão removidas
- **Removed**: Funcionalidades removidas
- **Fixed**: Correção de bugs
- **Security**: Correções de vulnerabilidades

### Formato de Entrada

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- Descrição clara da mudança (#issue, @autor)
```

### Versionamento

- **MAJOR (X)**: Mudanças incompatíveis
- **MINOR (Y)**: Novas funcionalidades compatíveis
- **PATCH (Z)**: Correções de bugs compatíveis

---

## Links

- [Releases](https://github.com/motochefe/universidade/releases)
- [Issues](https://github.com/motochefe/universidade/issues)
- [Pull Requests](https://github.com/motochefe/universidade/pulls)
