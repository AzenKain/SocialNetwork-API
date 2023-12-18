import { Module } from '@nestjs/common';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './type/user.entity';
import { CommitEntity } from './type/commit.entity';
import { RoomchatModule } from 'src/roomchat/roomchat.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, CommitEntity]),
        RoomchatModule
    ],
    providers: [UserResolver, UserService]
})
export class UserModule {}
