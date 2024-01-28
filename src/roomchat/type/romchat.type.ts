import { Field, ObjectType } from "@nestjs/graphql";
import { GraphQLJSONObject } from "graphql-type-json";
import { MessageType } from "src/message/message.type";


@ObjectType("Roomchat")
export class RoomchatType {
    @Field()
    id: string;

    @Field({nullable: true})
    title: string;

    @Field()
    isDisplay: boolean;

    @Field()
    isSingle: boolean;

    @Field()
    isBlock: boolean;

    @Field()
    ownerUserId: string;

    @Field({nullable: true})
    description: string | null;
    
    @Field({nullable: true})
    imgDisplay: string | null;
    
    @Field(() => [String])
    member: string[];
    
    @Field(() => [MemberOutType])
    memberOut : MemberOutType[];

    @Field(() => [MessageType])
    data: MessageType[];


    @Field()
    created_at: Date;
    
    @Field()
    updated_at: Date;
}

@ObjectType("MemberOut")
export class MemberOutType {
    @Field()
    memberId: string;

    @Field()
    messageCount: number;

    @Field()
    created_at: Date;
    
    @Field()
    updated_at: Date;
}