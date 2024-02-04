import { Field, InputType, } from "@nestjs/graphql";
import { IsDate, IsNotEmpty, IsOptional, IsString } from "class-validator";

@InputType()
export class ValidateUserDto {
    @IsString()
    @IsNotEmpty()
    @Field()
    userId: string;

    @IsString()
    @IsOptional()
    @Field()
    name?: string;

    @IsString()
    @IsOptional()
    @Field()
    nickName?: string;

    @IsString()
    @IsOptional()
    @Field()
    description?: string;

    @IsString()
    @IsOptional()
    @Field({ nullable: true })
    avatarUrl?: string;

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