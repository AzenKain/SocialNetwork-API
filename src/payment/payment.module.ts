import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentResolver } from './payment.resolver';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/type/user.entity';

@Module({
  imports: [HttpModule, TypeOrmModule.forFeature([User]),],
  
  providers: [PaymentService, PaymentResolver]
})
export class PaymentModule {}
