import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { RoomchatType } from './romchat.type';
import { RoomchatService } from './roomchat.service';
import { UseGuards } from '@nestjs/common';
import { JwtGuardGql } from 'src/auth/guard';
import { AddMemberRoomDto, CreateRoomDto } from './dto';
import { RoomchatGateway } from './roomchat.gateway';


@UseGuards(JwtGuardGql)
@Resolver(() => RoomchatType)
export class RoomchatResolver {
    constructor(
        private roomchatService: RoomchatService,
        private roomchatGateway: RoomchatGateway
    ) { }

    @Query(() => [RoomchatType])
    getAllRomchatByUserId(
        @Args('id') userId: string
    ) {
        return this.roomchatService.getAllRomchatByUserId(userId);
    }

    @Query(() => RoomchatType)
    getRomchatById(
        @Args('id') id: string
    ) {
        return this.roomchatService.getRoomchatById(id);
    }

    @Mutation(() => RoomchatType)
    async createRoomChat(
        @Args('createRoom') createRoom: CreateRoomDto
    ) {
        const newRoom = await this.roomchatService.createRoomchat(createRoom)
        await this.roomchatGateway.addMembersRoomchat(newRoom.id, newRoom.member);
        await this.roomchatGateway.notification(newRoom.id, "New Room created!")
        return newRoom;
    }

    @Query(() => RoomchatType)
    async addMemberRomchatById(
        @Args('addMemberRoom') addMemberRoom: AddMemberRoomDto
    ) {
        const newRoom = await this.roomchatService.addUserToRoomchat(addMemberRoom)
        await this.roomchatGateway.addMembersRoomchat(newRoom.id, newRoom.member);
        await this.roomchatGateway.notification(newRoom.id, "New Member Add!")
        return newRoom;
    }
}
