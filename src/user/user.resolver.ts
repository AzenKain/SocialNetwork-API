import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { UserType } from "./type/user.type";
import { UserService } from './user.service';

import { HttpCode, UseGuards } from "@nestjs/common";
import { JwtGuardGql } from "src/auth/guard";
import { ChangePasswordDto, FriendDto, NotificationDto, ValidateUserDto } from './dto';
import { RoomchatGateway } from "src/roomchat/roomchat.gateway";
import { CommitType } from "../commit/commit.type";

@UseGuards(JwtGuardGql)
@Resolver(() => UserType)
export class UserResolver {
    constructor(
        private userService: UserService,
        private romchatGatway: RoomchatGateway
    ) {}

    @HttpCode(200)
    @Query(()=>UserType)
    async getUser(
        @Args('id') userId: string
    ) {
        return await this.userService.getUser(userId);
    }

    @HttpCode(201)
    @Query(()=>[UserType])
    async findUser(
        @Args('content') content: string
    ) {
        return await this.userService.findUser(content);
    }

    @HttpCode(201)
    @Mutation(()=>UserType)
    async validateUser(
        @Args('validateUser') validateUser: ValidateUserDto
    ) {
        const data = await this.userService.validateUser(validateUser);
        return data
    }

    @HttpCode(201)
    @Mutation(()=>UserType)
    async changePassword(
        @Args('changePassword') validateUser: ChangePasswordDto
    ) {
        const data = await this.userService.changePassword(validateUser);
        return data;
    }

    @HttpCode(201)
    @Mutation(()=>CommitType)
    async addFriendUser(
        @Args('addFriend') addFriend: FriendDto
    ) {
        const data = await this.userService.addFriend(addFriend);
        this.romchatGatway.notification(addFriend.friendId,"newFriend", data);
        return data;
    }

    @HttpCode(201)
    @Query(()=>CommitType)
    async acceptFriendUser(
        @Args('acceptFriend') addFriend: FriendDto
    ) {
        const data = await this.userService.receiveFriend(addFriend);
        this.romchatGatway.notification(addFriend.friendId, "friendAccept", data);
        return data;
    }

    @HttpCode(201)
    @Mutation(()=> CommitType)
    async removeFriendUser(
        @Args('removeFriend') removeFriend: FriendDto
    ) {
        const data = await  this.userService.removeFriend(removeFriend);
        this.romchatGatway.notification(removeFriend.friendId, "removeFriend", data);
        return data;
    }

    @HttpCode(201)
    @Query(()=>[CommitType])
    async getFriendRequest(
        @Args('id') userId: string
    ) {
        return await this.userService.getFriendRequest(userId);
    }

    @HttpCode(201)
    @Mutation(()=>UserType)
    addNotificationUser(
        @Args('addNotification') notification: NotificationDto
    ) {
        return this.userService.addNotification(notification);
    }
}
