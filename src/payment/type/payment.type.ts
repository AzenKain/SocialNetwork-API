import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType("Payment")
export class PaymentType {
    @Field()
    status: string;

    @Field()
    url: string;
}


