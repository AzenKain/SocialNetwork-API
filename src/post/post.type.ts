import { Field, ObjectType } from "@nestjs/graphql";
import { InteractionType } from "src/interaction/interaction.type";
import { MessageType } from "src/message/message.type";

@ObjectType("Post")
export class PostType {
    @Field()
    id: string;

    @Field()
    ownerUserId: string;
    
    @Field({nullable: true})
    linkedShare: string | null;

    @Field()
    content: string;

    @Field(() => [String])
    fileUrl: string[];

    @Field()
    isDisplay: boolean;

    @Field(() => [InteractionType])
    interaction: InteractionType[];

    @Field(() => [MessageType])
    comment: MessageType[];
    
    @Field()
    created_at: Date;
        
    @Field()
    updated_at: Date;
}
