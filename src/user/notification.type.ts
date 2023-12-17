import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType("NotificationType")
export class NotificationType {
    @Field()
    id: string;

    @Field({ nullable: true })
    content: string | null;

    @Field()
    created_at: Date;

    @Field()
    updated_at: Date;
}


