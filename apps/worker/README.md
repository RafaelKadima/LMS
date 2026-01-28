# @motochefe/worker

Worker de processamento de vídeo da Universidade MotoChefe.

## Tecnologias

- NestJS 10
- BullMQ (filas)
- FFmpeg (transcoding)
- AWS SDK (S3/R2)
- Prisma ORM

## Responsabilidades

1. **Processamento de Vídeo**
   - Download do vídeo original do R2
   - Transcoding para HLS (360p, 480p, 720p)
   - Geração de thumbnail
   - Upload dos arquivos HLS para R2
   - Atualização de metadados no banco

2. **xAPI Outbox** (futuro)
   - Envio de statements em batch
   - Retry com backoff exponencial

## Fluxo de Processamento

```
1. API enfileira job (video-processing)
2. Worker consome job
3. Download vídeo original
4. FFmpeg gera HLS:
   - master.m3u8
   - 360p/playlist.m3u8 + segments
   - 480p/playlist.m3u8 + segments
   - 720p/playlist.m3u8 + segments
   - thumb.jpg
5. Upload para R2
6. Atualiza lesson.manifestUrl no banco
```

## Estrutura HLS Gerada

```
videos/{lessonId}/v{timestamp}/
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

## Pré-requisitos

- FFmpeg instalado no sistema
- Redis rodando
- Acesso ao Cloudflare R2

## Scripts

```bash
# Desenvolvimento
pnpm dev

# Build
pnpm build

# Start produção
pnpm start
```

## Variáveis de Ambiente

- `REDIS_HOST` / `REDIS_PORT`
- `DATABASE_URL`
- `R2_ENDPOINT` / `R2_BUCKET` / `R2_ACCESS_KEY` / `R2_SECRET_KEY`
- `FFMPEG_PATH` / `FFPROBE_PATH`
