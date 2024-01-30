import { Field, InputType } from "@nestjs/graphql";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";


@InputType()
export class ValidateMemberDto {
    @IsString()
    @IsNotEmpty()
    @Field()
    userId: string;

    @IsString()
    @IsNotEmpty()
    @Field()
    roomchatId: string;

    @IsString()
    @IsOptional()
    @Field({nullable: true})
    nickName?: string | null;

    @IsOptional()
    @Field(() => [String], {nullable: true})
    fileUrl?: string | null;
}