import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { FileUpload } from './type';
import { TypeOrmModule } from '@nestjs/typeorm';


@Module({
  imports: [TypeOrmModule.forFeature([FileUpload])],
  providers: [MediaService],
  controllers: [MediaController]
})
export class MediaModule {}
