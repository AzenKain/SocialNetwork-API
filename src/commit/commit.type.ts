import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType("Commit")
export class CommitType {
    @Field()
    id: string;

    @Field()
    createdUserId: string;

    @Field()
    receiveUserId: string;

    @Field()
    value: boolean;

    @Field()
    isDisplay: boolean;

    @Field()
    created_at: Date;

    @Field()
    updated_at: Date;
}
