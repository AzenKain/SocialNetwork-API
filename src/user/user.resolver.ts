import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { UserType } from "./type/user.type";
import { UserService } from './user.service';

import { UseGuards } from "@nestjs/common";
import { JwtGuardGql } from "src/auth/guard";
import { ChangePasswordDto, FriendDto, NotificationDto, ValidateUserDto } from './dto';
import { RoomchatGateway } from "src/roomchat/roomchat.gateway";

@UseGuards(JwtGuardGql)
@Resolver(() => UserType)
export class UserResolver {
    constructor(
        private userService: UserService,
        private romchatGatway: RoomchatGateway
    ) {}

    @Query(()=>UserType)
    async getUser(
        @Args('id') userId: string
    ) {
        return await this.userService.getUser(userId);
    }

    @Mutation(()=>UserType)
    async validateUser(
        @Args('validateUser') validateUser: ValidateUserDto
    ) {
        const data = await this.userService.validateUser(validateUser);
        return data
    }

    @Mutation(()=>UserType)
    async changePassword(
        @Args('changePassword') validateUser: ChangePasswordDto
    ) {
        const data = await this.userService.changePassword(validateUser);
        return data;
    }

    @Mutation(()=>UserType)
    async addFriendUser(
        @Args('addFriend') addFriend: FriendDto
    ) {
        const data = await this.userService.addFriend(addFriend);
        this.romchatGatway.notification(addFriend.friendId,"newFriend", data);
        return data;
    }

    @Query(()=>UserType)
    async acceptFriendUser(
        @Args('acceptFriend') addFriend: FriendDto
    ) {
        const data = await this.userService.receiveFriend(addFriend);
        this.romchatGatway.notification(addFriend.friendId,"friendAccept", data);
        return data;
    }

    @Mutation(()=>UserType)
    async removeFriendUser(
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
