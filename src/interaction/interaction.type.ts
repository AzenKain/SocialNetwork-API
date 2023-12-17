import { Field, ObjectType } from "@nestjs/graphql";


@ObjectType("Interaction")
export class InteractionType {
    @Field()
    id: string;

    @Field()
    content: string;

    @Field()
    userId: string;

    @Field()
    created_at: Date;
    
    @Field()
    updated_at: Date;
}