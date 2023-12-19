import { Field, InputType } from "@nestjs/graphql";
import { IsNotEmpty, IsString } from "class-validator";

@InputType()
export class ChangePasswordDto {
    @IsString()
    @IsNotEmpty()
    @Field()
    userId: string;
    
    @IsString()
    @IsNotEmpty()
    @Field()
    currentPassword: string;

    @IsString()
    @IsNotEmpty()
    @Field()
    newPassword: string;

    @IsString()
    @IsNotEmpty()
    @Field()
    validatePassword: string;
}