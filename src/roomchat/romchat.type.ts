import { Field, ObjectType } from "@nestjs/graphql";
import { FileType } from "src/media/type";
import { MessageType } from "src/message/message.type";


@ObjectType("Roomchat")
export class RoomchatType {
    @Field()
    id: string;

    @Field()
    isSingle: boolean;

    @Field()
    ownerUserId: string;

    @Field({nullable: true})
    description: string | null;
    
    @Field({nullable: true})
    imgDisplay: string | null;
    
    @Field(() => [String])
    member: string[];

    @Field(() => [MessageType])
    data: MessageType[];

    @Field()
    created_at: Date;
    
    @Field()
    updated_at: Date;
}
