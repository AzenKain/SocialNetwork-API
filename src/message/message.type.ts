import { Field, ObjectType } from "@nestjs/graphql";
import { InteractionType } from "src/interaction/interaction.type";


@ObjectType("Message")
export class MessageType {
    @Field()
    id: string;

    @Field()
    userId: string;

    @Field()
    roomId: string;

    @Field()
    isDisplay: boolean;

    @Field()
    content: string;
    
    @Field(() => [String], {nullable: true})
    fileUrl: string[] | null;

    @Field(() => [InteractionType], {nullable: true})
    interaction: InteractionType[] | null;
    
    @Field()
    created_at: Date;
    
    @Field()
    updated_at: Date;
}
