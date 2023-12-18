import { Field, InputType } from "@nestjs/graphql";
import { IsNotEmpty, IsString } from "class-validator";

@InputType()
export class MemberRoomDto {
    @IsString()
    @IsNotEmpty()
    @Field()
    userId: string;

    @IsString()
    @IsNotEmpty()
    @Field()
    roomchatId: string;

    @IsNotEmpty()
    @Field(() => [String])
    member: string[];
}