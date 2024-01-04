import { Field, InputType, Int } from "@nestjs/graphql";
import {IsDate, IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

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
    name: string;

    @IsDate()
    @IsOptional()
    @Field({ nullable: true })
    birthday?: Date;

    @IsNumber()
    @IsOptional()
    @Field({ nullable: true })
    phoneNumber?: number;
}