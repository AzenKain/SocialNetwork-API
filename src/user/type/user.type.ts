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
    description?: string | null;

    @Field({ nullable: true })
    phoneNumber?: string | null;

    @Field({ nullable: true })
    gender?: string | null;

    @Field({ nullable: true })
    countryCode?: string | null;

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
    role: string;
    
    @Field()
    isOnline: boolean;

    @Field(()=> ProfileType)
    detail: ProfileType;

    @Field(() => [String],{ nullable: true })
    friends: string[];

    @Field(() => [String],{ nullable: true })
    bookMarks: string[];

    @Field(()=> [NotificationType],{ nullable: true })
    notification: NotificationType[];
    
    @Field({ nullable: true })
    premiumTime: Date;
    
    @Field()
    created_at: Date;

    @Field()
    updated_at: Date;
}
