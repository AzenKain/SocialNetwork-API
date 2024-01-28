import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType("IsOtp")
export class IsOtpType {
    @Field()
    isRequest: boolean;

    @Field({ nullable: true })
    otpId?: string | null;
}


