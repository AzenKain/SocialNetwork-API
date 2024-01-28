import { Field, InputType } from "@nestjs/graphql";
import { IsNotEmpty, IsString } from "class-validator";

@InputType()
export class ForgetPasswordDto {
    @IsString()
    @IsNotEmpty()
    @Field()
    email: string;

    @IsString()
    @IsNotEmpty()
    @Field()
    otpId: string;

    @IsString()
    @IsNotEmpty()
    @Field()
    newPassword: string;

    @IsString()
    @IsNotEmpty()
    @Field()
    validatePassword: string;
}