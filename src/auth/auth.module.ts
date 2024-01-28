import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtRefreshStrategy, JwtStrategy } from './strategy';
import { AuthResolver } from './auth.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/type/user.entity';
import { AuthController } from './auth.controller';
import { RoomchatModule } from 'src/roomchat/roomchat.module';
import { OtpCode } from 'src/user/type/otpCode.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, OtpCode]), RoomchatModule],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy, AuthResolver],
  controllers: [AuthController]
})
export class AuthModule {}
