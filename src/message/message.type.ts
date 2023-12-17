import { Field, ObjectType } from "@nestjs/graphql";
import { InteractionType } from "src/interaction/interaction.type";
import { FileType } from "src/media/type";


@ObjectType("Message")
export class MessageType {
    @Field()
    id: string;

    @Field()
    userId: string;

    @Field()
    isDisplay: boolean;

    @Field()
    content: string;
    
    @Field(() => [FileType])
    fileUrl: FileType[];

    @Field(() => [InteractionType])
    interaction: InteractionType[];
    @Field()
    created_at: Date;
    
    @Field()
    updated_at: Date;
}
