import { Field, ObjectType } from "@nestjs/graphql";


@ObjectType("File")
export class FileType {
    @Field()
    id: string;

    @Field()
    url: string;

    @Field()
    userId: string;

    @Field()
    created_at: Date;
    
    @Field()
    updated_at: Date;
}