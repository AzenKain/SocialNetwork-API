import { Field, InputType } from "@nestjs/graphql";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

@InputType()
export class ValidateRoomDto {
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
    description?: string | null;

    @IsString()
    @IsOptional()
    @Field({nullable: true})
    imgDisplay?: string | null;
}