import { Field, InputType } from "@nestjs/graphql";
import {IsDateString, IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

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

    @IsDateString()
    @IsOptional()
    @Field({ nullable: true })
    birthday?: string;

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