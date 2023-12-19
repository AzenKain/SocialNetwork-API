import { Field, ObjectType } from "@nestjs/graphql";


@ObjectType("NullResponse")
export class NullType {
    @Field({nullable: true})
    data: string | null
}
