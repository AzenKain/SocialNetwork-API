
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SocketAdapter } from './SocketAdapter';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
  });
  app.useWebSocketAdapter(new SocketAdapter(app));
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
  }));
  await app.listen(3434);
}
bootstrap();
