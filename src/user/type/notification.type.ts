import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType("NotificationType")
export class NotificationType {
    @Field()
    id: string;

    @Field()
    type: string;

    @Field({ nullable: true })
    content: string | null;

    @Field(() => [String])
    fileUrl: string[];

    @Field()
    created_at: Date;

    @Field()
    updated_at: Date;
}


