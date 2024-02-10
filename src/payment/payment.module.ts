import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentResolver } from './payment.resolver';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/type/user.entity';
import { PaymentController } from './payment.controller';
import { BillEntity } from './type/bill.entity';

@Module({
  imports: [HttpModule, TypeOrmModule.forFeature([User, BillEntity]),],
  
  providers: [PaymentService, PaymentResolver],
  
  controllers: [PaymentController]
})
export class PaymentModule {}
