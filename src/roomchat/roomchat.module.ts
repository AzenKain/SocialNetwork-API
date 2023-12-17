import { Module } from '@nestjs/common';
import { RoomchatGateway } from './roomchat.gateway';
import { RoomchatService } from './roomchat.service';
import { Roomchat } from './romchat.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/user.entity';
import { RoomchatResolver } from './roomchat.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([Roomchat, User]),
  ],
  providers: [RoomchatGateway, RoomchatService, RoomchatResolver]
})
export class RoomchatModule {}
