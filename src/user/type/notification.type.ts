import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType("DataNotificationType")
export class DataNotificationType {
    @Field({ nullable: true })
    roomId: string | null;

    @Field({ nullable: true })
    userDtoId?: string | null;
}

@ObjectType("NotificationType")
export class NotificationType {
    @Field()
    id: string;

    @Field()
    type: string;

    @Field()
    isRead: boolean;

    @Field()
    isDisplay: boolean;

    @Field(() => DataNotificationType, { nullable: true })
    content: DataNotificationType | null;

    @Field()
    created_at: Date;

    @Field()
    updated_at: Date;
}
