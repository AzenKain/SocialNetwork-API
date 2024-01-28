import { Args, Mutation, Resolver } from "@nestjs/graphql";
import { PaymentService } from './payment.service';
import { UseGuards } from '@nestjs/common';
import { JwtGuardGql } from 'src/auth/guard';
import { PaymentType } from './type';
import { PaymentDto } from "./dto";

@UseGuards(JwtGuardGql)
@Resolver(() => PaymentType)
export class PaymentResolver {
    constructor(private paymentService: PaymentService) { }

    @Mutation(() => PaymentType)
    async generateMomoPayment(@Args('payment') payment: PaymentDto): Promise<PaymentType> {
        if (payment.method === "Momo") {
            return await this.paymentService.generateMomo(payment);
        }
        else if (payment.method === "Vnpay") {
            
        }
        return { status: "fail", url: "" }

    }
}
