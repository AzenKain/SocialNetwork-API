import { Field, InputType } from "@nestjs/graphql";
import {IsEmail, IsNotEmpty, IsString } from "class-validator";

@InputType()
export class AuthDto {
    @IsString()
    @IsNotEmpty()
    @IsEmail()
    @Field()
    email: string;

    @IsString()
    @IsNotEmpty()
    @Field()
    password: string;
}