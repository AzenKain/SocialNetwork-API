import { Field, InputType } from "@nestjs/graphql";
import {IsDate, IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

@InputType()
export class SignUpDto {
    @IsString()
    @IsNotEmpty()
    @IsEmail()
    @Field()
    email: string;

    @IsString()
    @IsNotEmpty()
    @Field()
    password: string;

    @IsString()
    @IsNotEmpty()
    @Field()
    otpId: string;
    
    @IsString()
    @IsNotEmpty()
    @Field()
    name: string;

    @IsDate()
    @IsOptional()
    @Field({ nullable: true })
    birthday?: Date;

    @IsString()
    @IsOptional()
    @Field({ nullable: true })
    gender?: string;

    @IsString()
    @IsOptional()
    @Field({ nullable: true })
    phoneNumber?: string;

    @IsString()
    @IsOptional()
    @Field({ nullable: true })
    countryCode?: string;
}