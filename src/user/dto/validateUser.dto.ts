import { Field, InputType, Int } from "@nestjs/graphql";
import { IsDate, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

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
    @Field()
    avatarUrl?: string;

    @IsDate()
    @IsOptional()
    @Field({ nullable: true })
    birthday?: Date;

    @IsNumber()
    @IsOptional()
    @Field(() => Int, { nullable: true })
    age?: number;

    @IsNumber()
    @IsOptional()
    @Field(()=> Int, { nullable: true })
    phoneNumber?: number;
}