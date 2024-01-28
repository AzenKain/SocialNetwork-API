import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { UserType } from "./type/user.type";
import { UserService } from './user.service';

import { HttpCode, UseGuards } from "@nestjs/common";
import { JwtGuardGql } from "src/auth/guard";
import { ChangePasswordDto, 
    FriendDto, 
    NotificationDto, 
    ValidateUserDto, 
    BookMarkDto, 
    ForgetPasswordDto,
    ValidateOtpDto 
} from './dto';
import { RoomchatGateway } from "src/roomchat/roomchat.gateway";
import { CommitType } from "../commit/commit.type";
import { NullType } from "src/post/type/null.type";
import { BookmarkType } from './type/bookmark.type';
import { IsOtpType } from "./type/isOtp.type";


@Resolver(() => UserType)
export class UserResolver {
    constructor(
        private userService: UserService,
        private romchatGatway: RoomchatGateway
    ) {}
    @UseGuards(JwtGuardGql)
    @HttpCode(200)
    @Query(()=>UserType)
    async getUser(
        @Args('id') userId: string
    ) {
        return await this.userService.getUser(userId);
    }
    @UseGuards(JwtGuardGql)
    @HttpCode(201)
    @Query(()=>[UserType])
    async findUser(
        @Args('content') content: string
    ) {
        return await this.userService.findUser(content);
    }
    @UseGuards(JwtGuardGql)
    @HttpCode(201)
    @Mutation(()=>UserType)
    async validateUser(
        @Args('validateUser') validateUser: ValidateUserDto
    ) {
        const data = await this.userService.validateUser(validateUser);
        return data
    }

    @UseGuards(JwtGuardGql)
    @HttpCode(201)
    @Mutation(()=>UserType)
    async changePassword(
        @Args('changePassword') validateUser: ChangePasswordDto
    ) {
        const data = await this.userService.changePassword(validateUser);
        return data;
    }

    @UseGuards(JwtGuardGql)
    @HttpCode(201)
    @Mutation(()=>CommitType)
    async addFriendUser(
        @Args('addFriend') addFriend: FriendDto
    ) {
        const data = await this.userService.addFriend(addFriend);
        this.romchatGatway.notification(addFriend.friendId,"newFriend", data);
        return data;
    }
    
    @UseGuards(JwtGuardGql)
    @HttpCode(201)
    @Query(()=>CommitType)
    async acceptFriendUser(
        @Args('acceptFriend') addFriend: FriendDto
    ) {
        const data = await this.userService.receiveFriend(addFriend);
        this.romchatGatway.notification(addFriend.friendId, "friendAccept", data);
        return data;
    }

    @UseGuards(JwtGuardGql)
    @HttpCode(201)
    @Mutation(()=>BookmarkType)
    async addBookMarkUser(
        @Args('addBookMark') addBookMark: BookMarkDto
    ) {
        return await this.userService.addBookMark(addBookMark);
    }
    
    @HttpCode(201)
    @Mutation(()=>IsOtpType)
    async createOtpCode(
        @Args('createOtp') createOtp: ValidateOtpDto
    ) {
        return await this.userService.createOtpCode(createOtp);
    }

    @HttpCode(201)
    @Mutation(()=>IsOtpType)
    async validateOtpCode(
        @Args('validateOtp') validateOtp: ValidateOtpDto
    ) {
        return await this.userService.validateOptCode(validateOtp)
    }

    @HttpCode(201)
    @Query(()=>UserType)
    async forgetPasswordValidate(
        @Args("forgetPassword") forgetPassword : ForgetPasswordDto
    ) {
        return await this.userService.forgetPasswordValidate(forgetPassword);
    }

    @UseGuards(JwtGuardGql)
    @HttpCode(201)
    @Mutation(()=>NullType)
    async removeBookMarkUser(
        @Args('removeBookMark') removeBookMark: BookMarkDto
    ) {
        await this.userService.removeBookMark(removeBookMark);
        return {data : null}
    }

    @UseGuards(JwtGuardGql)
    @HttpCode(201)
    @Mutation(()=> CommitType)
    async removeFriendUser(
        @Args('removeFriend') removeFriend: FriendDto
    ) {
        const data = await  this.userService.removeFriend(removeFriend);
        this.romchatGatway.notification(removeFriend.friendId, "removeFriend", data);
        return data;
    }

    @UseGuards(JwtGuardGql)
    @HttpCode(201)
    @Query(()=>[CommitType])
    async getFriendRequest(
        @Args('id') userId: string
    ) {
        return await this.userService.getFriendRequest(userId);
    }

    @UseGuards(JwtGuardGql)
    @HttpCode(201)
    @Query(()=>[CommitType])
    async getFriendReceive(
        @Args('id') userId: string
    ) {
        return await this.userService.getFriendReceive(userId);
    }

    @UseGuards(JwtGuardGql)
    @HttpCode(201)
    @Mutation(()=>UserType)
    addNotificationUser(
        @Args('addNotification') notification: NotificationDto
    ) {
        return this.userService.addNotification(notification);
    }
}
