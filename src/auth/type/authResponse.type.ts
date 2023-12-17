import { Field, ObjectType } from "@nestjs/graphql";


@ObjectType("AuthResponse")
export class AuthResponseType {
    @Field()
    access_token: string;

    @Field()
    refresh_token: string;
}


@ObjectType("LogoutResponse")
export class LogoutResponseType {
    @Field({nullable: true})
    response: string;
}
