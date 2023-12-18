import { Field, InputType } from "@nestjs/graphql";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";


@InputType()
export class InteractPostDto {
    @IsString()
    @IsNotEmpty()
    @Field()
    userId: string;

    @IsString()
    @IsNotEmpty()
    @Field()
    postId: string;
    
    @IsString()
    @IsOptional()
    @Field({nullable: true})
    content: string | null;
}