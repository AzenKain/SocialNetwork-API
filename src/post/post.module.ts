import { Module } from '@nestjs/common';
import { PostResolver } from './post.resolver';
import { PostService } from './post.service';
import { PostEntity } from './post.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/type/user.entity';
import { PostGateway } from './post.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([PostEntity, User]),
  ],
  providers: [PostResolver, PostService, PostGateway]
})
export class PostModule {}
