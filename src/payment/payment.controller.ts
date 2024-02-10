import { Controller, Get, Param } from '@nestjs/common';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
    constructor(
        private paymentService : PaymentService
    ){

    }
    @Get('validate/:userId/:billId')
    async getFileById(@Param('userId') userId: string, @Param('billId') billId: string) {
        await this.paymentService.validateGift(userId, billId)
        return {data: null}
    }
}
