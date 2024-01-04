
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SocketAdapter } from './SocketAdapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
  });
  app.useWebSocketAdapter(new SocketAdapter(app));
  await app.listen(3434);
}
bootstrap();
