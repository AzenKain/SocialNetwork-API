import { Module } from '@nestjs/common';
import { RoomchatGateway } from './roomchat.gateway';
import { RoomchatService } from './roomchat.service';
import { Roomchat } from './type/romchat.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/type/user.entity';
import { RoomchatResolver } from './roomchat.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([Roomchat, User]),
  ],
  providers: [RoomchatGateway, RoomchatService, RoomchatResolver],
  exports: [RoomchatGateway, RoomchatService]
})
export class RoomchatModule {}
