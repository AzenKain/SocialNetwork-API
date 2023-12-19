import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { RoomchatType } from './type/romchat.type';
import { RoomchatService } from './roomchat.service';
import { HttpCode, UseGuards } from '@nestjs/common';
import { JwtGuardGql } from 'src/auth/guard';
import { MemberRoomDto, CreateRoomDto, ValidateMessageDto, ValidateRoomDto, InteractMessageDto } from './dto';
import { RoomchatGateway } from './roomchat.gateway';
import { NullType } from 'src/post/type/null.type';
import { MessageType } from 'src/message/message.type';



@UseGuards(JwtGuardGql)
@Resolver(() => RoomchatType)
export class RoomchatResolver {
    constructor(
        private roomchatService: RoomchatService,
        private roomchatGateway: RoomchatGateway
    ) { }
    @HttpCode(200)
    @Query(() => [RoomchatType])
    getAllRomchatByUserId(
        @Args('id') userId: string
    ) {
        return this.roomchatService.getAllRomchatByUserId(userId);
    }

    @HttpCode(200)
    @Query(() => RoomchatType)
    getRomchatById(
        @Args('id') id: string
    ) {
        return this.roomchatService.getRoomchatById(id);
    }

    @HttpCode(201)
    @Mutation(() => RoomchatType)
    async createRoomChat(
        @Args('createRoom') createRoom: CreateRoomDto
    ) {
        const newRoom = await this.roomchatService.createRoomchat(createRoom)
        await this.roomchatGateway.addMembersRoomchat(newRoom.id, newRoom.member);
        await this.roomchatGateway.notification(newRoom.id, "newRoomCreated", newRoom)
        return newRoom;
    }

    @HttpCode(204)
    @Mutation(() => NullType)
    async removeRoomChat(
        @Args('removeRoomChat') validateRoom: ValidateRoomDto
    ) {
        await this.roomchatService.removeRoomChat(validateRoom)
        await this.roomchatGateway.notification(validateRoom.roomchatId, "removeRoom", validateRoom)
    }

    @HttpCode(201)
    @Mutation(() => RoomchatType)
    async addMemberRomchat(
        @Args('addMember') addMemberRoom: MemberRoomDto
    ) {
        const newRoom = await this.roomchatService.addUserToRoomchat(addMemberRoom)
        await this.roomchatGateway.addMembersRoomchat(newRoom.id, newRoom.member);
        await this.roomchatGateway.notification(newRoom.id, "addMember", newRoom)
        return newRoom;
    }
    
    @HttpCode(204)
    @Mutation(() => NullType)
    async removeMemberRoomchat(
        @Args('removeMember') removeMemberRoom: MemberRoomDto
    ) {
        const newRoom = await this.roomchatService.removeUserFromRoomchat(removeMemberRoom)
        await this.roomchatGateway.leaveMembersRoomchat(newRoom.id, newRoom.member);
        await this.roomchatGateway.notification(newRoom.id, "removeMember", removeMemberRoom)
    }

    @HttpCode(204)
    @Mutation(() => NullType)
    async removeMessageRoomchat(
        @Args('removeMessage') removeMessage: ValidateMessageDto
    ) {
        await this.roomchatService.removeMessage(removeMessage)
        await this.roomchatGateway.notification(removeMessage.roomchatId, "removeMessage", removeMessage)
    }

    @HttpCode(201)
    @Mutation(() => MessageType)
    async addInteractMessageRoomchat(
        @Args('addInteractMessage') message: InteractMessageDto
    ) {
        const data = await this.roomchatService.addInteractMessage(message)
        await this.roomchatGateway.notification(message.roomchatId, "addInteractMessage", message)
        return data;
    }

    @HttpCode(204)
    @Mutation(() => NullType)
    async removeInteractMessageRoomchat(
        @Args('removeInteractMessage') message: ValidateMessageDto
    ) {
        await this.roomchatService.removeInteractMessage(message)
        await this.roomchatGateway.notification(message.roomchatId, "removeInteractMessage", message)
    }

    @HttpCode(201)
    @Mutation(() => RoomchatType)
    async validateRomchat(
        @Args('validateRoom') validateRoom: ValidateRoomDto
    ) {
        const newRoom = await this.roomchatService.validateRoomchat(validateRoom)
        await this.roomchatGateway.notification(validateRoom.roomchatId, "validateRoom", validateRoom)
        return newRoom;
    }

    @HttpCode(201)
    @Mutation(() => MessageType)
    async validateMessage(
        @Args('validateMessage') validateMessage: ValidateMessageDto
    ) {
        const data = await this.roomchatService.validateMessage(validateMessage)
        await this.roomchatGateway.notification(validateMessage.roomchatId, "validateMessage", validateMessage)
        return data;
    }
}

