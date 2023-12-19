import { Field, InputType } from "@nestjs/graphql";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

@InputType()
export class SharePostDto {
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

    @IsOptional()
    @Field(() => [String])
    fileUrl: string[];
}