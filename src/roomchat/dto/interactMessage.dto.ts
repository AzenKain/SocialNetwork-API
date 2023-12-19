import { Field, InputType } from "@nestjs/graphql";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";


@InputType()
export class InteractMessageDto {
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
    content: string | null;
}