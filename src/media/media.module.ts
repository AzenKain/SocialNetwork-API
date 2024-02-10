import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { FileUpload } from './type';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/type/user.entity';


@Module({
  imports: [TypeOrmModule.forFeature([FileUpload, User])],
  providers: [MediaService],
  controllers: [MediaController]
})
export class MediaModule {}
