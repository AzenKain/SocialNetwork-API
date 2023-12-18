import { Field, InputType } from "@nestjs/graphql";
import { IsNotEmpty, IsString } from "class-validator";

@InputType()
export class FriendDto {
    @IsString()
    @IsNotEmpty()
    @Field()
    userId: string;

    @IsString()
    @IsNotEmpty()
    @Field()
    friendId: string;
}