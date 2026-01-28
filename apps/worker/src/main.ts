import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Worker não precisa de HTTP, mas mantemos um endpoint de saúde
  const port = process.env.WORKER_PORT || 4002;
  await app.listen(port);

  console.log(`🔧 Worker rodando na porta ${port}`);
  console.log(`📹 Fila de processamento de vídeos ativa`);
}

bootstrap();
