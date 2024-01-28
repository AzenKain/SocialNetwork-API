import { Module } from '@nestjs/common';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './type/user.entity';
import { CommitEntity } from '../commit/commit.entity';
import { RoomchatModule } from 'src/roomchat/roomchat.module';
import { OtpCode } from './type/otpCode.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, CommitEntity, OtpCode]),
        RoomchatModule
    ],
    providers: [UserResolver, UserService],
})
export class UserModule {}
