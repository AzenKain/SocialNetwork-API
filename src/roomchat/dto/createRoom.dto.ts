import { Field, InputType } from "@nestjs/graphql";
import { IsBoolean, IsNotEmpty, IsString } from "class-validator";

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

    @IsNotEmpty()
    @Field(() => [String])
    member: string[];
}