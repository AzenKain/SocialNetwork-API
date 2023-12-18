import { Field, InputType } from "@nestjs/graphql";
import { IsNotEmpty, IsString } from "class-validator";

@InputType()
export class ValidatePostDto {
    @IsString()
    @IsNotEmpty()
    @Field()
    userId: string;

    @IsString()
    @IsNotEmpty()
    @Field()
    postId: string;

    @IsString()
    @IsNotEmpty()
    @Field()
    Id: string;
}