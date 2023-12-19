import { Field, ObjectType } from "@nestjs/graphql";
import { MessageType } from "src/message/message.type";


@ObjectType("Roomchat")
export class RoomchatType {
    @Field()
    id: string;

    @Field()
    isDisplay: boolean;

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