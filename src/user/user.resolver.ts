import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { UserType } from "./type/user.type";
import { UserService } from './user.service';

import { UseGuards } from "@nestjs/common";
import { JwtGuardGql } from "src/auth/guard";
import { FriendDto, NotificationDto } from "./dto";
import { RoomchatGateway } from "src/roomchat/roomchat.gateway";

@UseGuards(JwtGuardGql)
@Resolver(() => UserType)
export class UserResolver {
    constructor(
        private userService: UserService,
        private romchatGatway: RoomchatGateway
    ) {}

    @Query(()=>UserType)
    getUser(
        @Args('id') userId: string
    ) {
        return this.userService.getUser(userId);
    }

    @Mutation(()=>UserType)
    addFriendUser(
        @Args('addFriend') addFriend: FriendDto
    ) {
        const data = this.userService.addFriend(addFriend);
        this.romchatGatway.notification(addFriend.friendId,"New friend", data);
        return data;
    }

    @Query(()=>UserType)
    acceptFriendUser(
        @Args('acceptFriend') addFriend: FriendDto
    ) {
        const data = this.userService.receiveFriend(addFriend);
        this.romchatGatway.notification(addFriend.friendId,"New friend accept", data);
        return data;
    }

    @Mutation(()=>UserType)
    removeFriendUser(
        @Args('addFriend') removeFriend: FriendDto
    ) {
        return this.userService.removeFriend(removeFriend);
    }

    @Mutation(()=>UserType)
    addNotificationUser(
        @Args('addNotification') notification: NotificationDto
    ) {
        return this.userService.addNotification(notification);
    }
}
