import { Field, InputType } from "@nestjs/graphql";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

@InputType()
export class ValidateOtpDto {
    @IsString()
    @IsNotEmpty()
    @Field()
    email: string;

    @IsString()
    @IsOptional()
    @Field({ nullable: true })
    otpCode?: string;

    @IsString()
    @IsNotEmpty()
    @Field()
    type: string;
}