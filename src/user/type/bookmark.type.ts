import { ObjectType, Field } from "@nestjs/graphql";

@ObjectType() 
export class BookmarkType {
    @Field()
    userId: string;

    @Field()
    bookmarkId: string;
}
