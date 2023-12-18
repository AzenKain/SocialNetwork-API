import { Field, InputType } from "@nestjs/graphql";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

@InputType()
export class NotificationDto {
    @IsString()
    @IsNotEmpty()
    @Field()
    userId: string;

    @IsString()
    @IsNotEmpty()
    @Field()
    type: string;

    @IsString()
    @IsNotEmpty()
    @Field()
    content: string;

    @IsOptional()
    @Field(() => [String])
    fileUrl: string[];
}