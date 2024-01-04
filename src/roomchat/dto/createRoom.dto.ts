import { Field, InputType } from "@nestjs/graphql";
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";

@InputType()
export class CreateRoomDto {
    @IsString()
    @IsNotEmpty()
    @Field()
    userId: string;

    @IsBoolean()
    @IsNotEmpty()
    @Field()
    isSingle: boolean;

    @IsString()
    @IsNotEmpty()
    @Field()
    title: string;

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