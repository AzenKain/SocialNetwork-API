import { Args, Context, Mutation, Resolver } from "@nestjs/graphql";
import { PaymentService } from './payment.service';
import { UseGuards } from '@nestjs/common';
import { JwtGuardGql } from 'src/auth/guard';
import { PaymentType } from './type';
import { PaymentDto } from "./dto";
import { Request } from 'express';

@UseGuards(JwtGuardGql)
@Resolver(() => PaymentType)
export class PaymentResolver {
    constructor(private paymentService: PaymentService) { }

    @Mutation(() => PaymentType)
    async generateMomoPayment(@Args('payment') payment: PaymentDto): Promise<PaymentType> {
        if (payment.method === "Momo") {
            return await this.paymentService.generateMomo(payment);
        }
        return { status: "fail", url: "" }

    }


    @Mutation(() => PaymentType)
    async generateVnpayPayment(@Args('payment') payment: PaymentDto, @Context('req') req: Request): Promise<PaymentType> {
        if (payment.method === "Vnpay") {
            return await this.paymentService.generateVnpay(payment, req);
        }
        return { status: "fail", url: "" }

    }
}
