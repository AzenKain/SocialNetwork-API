import { Field, InputType } from "@nestjs/graphql";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

@InputType()
export class CreateRoomDto {
    @IsString()
    @IsNotEmpty()
    @Field()
    userId: string;

    @IsNotEmpty()
    @Field(() => [String])
    member: string[];

    @IsString()
    @IsOptional()
    @Field({nullable: true})
    description?: string | null;

    @IsString()
    @IsOptional()
    @Field({nullable: true})
    imgDisplay?: string | null;
}