import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtRefreshStrategy, JwtStrategy } from './strategy';
import { AuthResolver } from './auth.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/type/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy, AuthResolver]
})
export class AuthModule {}
