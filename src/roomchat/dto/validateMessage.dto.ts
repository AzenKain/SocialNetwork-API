import { Field, InputType } from "@nestjs/graphql";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";


@InputType()
export class ValidateMessageDto {
    @IsString()
    @IsNotEmpty()
    @Field()
    userId: string;

    @IsString()
    @IsNotEmpty()
    @Field()
    roomchatId: string;

    @IsString()
    @IsNotEmpty()
    @Field()
    messageId: string;

    @IsString()
    @IsOptional()
    @Field({nullable: true})
    interactionId?: string | null;

    @IsString()
    @IsOptional()
    @Field({nullable: true})
    content?: string | null;

    @IsOptional()
    @Field(() => [String], {nullable: true})
    fileUrl?: string | null;
}