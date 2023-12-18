import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType("Commit")
export class CommitType {
    @Field()
    id: string;

    @Field()
    createdUser: string;

    @Field()
    receiveUserId: string;

    @Field()
    value: boolean;

    @Field()
    created_at: Date;

    @Field()
    updated_at: Date;
}
