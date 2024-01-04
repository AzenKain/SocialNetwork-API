import { Field, ObjectType } from "@nestjs/graphql";
import { NotificationType } from "./notification.type";

@ObjectType("ProfileType")
export class ProfileType {
    @Field()
    name: string;

    @Field({ nullable: true })
    nickName?: string | null;

    @Field({ nullable: true })
    birthday?: Date | null;

    @Field({ nullable: true })
    age?: number | null;

    @Field({ nullable: true })
    description?: string | null;

    @Field({ nullable: true })
    phoneNumber?: number | null;

    @Field({ nullable: true })
    avatarUrl?: string | null;
}

@ObjectType("User")
export class UserType {
    @Field()
    id: string;

    @Field()
    email: string;

    @Field()
    hash: string;

    @Field()
    refreshToken: string;

    @Field()
    isOnline: boolean;

    @Field(()=> ProfileType)
    detail: ProfileType;

    @Field(() => [String],{ nullable: true })
    friends: string[];
    
    @Field(()=> [NotificationType],{ nullable: true })
    notification: NotificationType[];

    @Field()
    created_at: Date;

    @Field()
    updated_at: Date;
}
