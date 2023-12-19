import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { Roomchat } from './type/romchat.entity';
import { Repository } from 'typeorm';
import { v5 as uuidv5 } from 'uuid';
import { MemberRoomDto, CreateRoomDto, InteractMessageDto, ValidateMessageDto, ValidateRoomDto } from './dto';
import { MessageType } from 'src/message/message.type';
import { MemberOutType } from './type/romchat.type';
import { InteractionType } from 'src/interaction/interaction.type';


@Injectable()
export class RoomchatService {
    constructor(
        private readonly jwtService: JwtService,
        private config: ConfigService,
        @InjectRepository(Roomchat) private roomchatRespository: Repository<Roomchat>,
    ) { }

    async getPayloadFromSocket(socket: Socket) {
        let auth_token = socket.handshake.headers.authorization;
        auth_token = auth_token.split(' ')[1];
        try {
            const payload = await this.jwtService.verifyAsync(
                auth_token,
                {
                    secret: this.config.get('JWT_SECRET')
                }
            );
            if (!payload) {
                throw new WsException('Invalid credentials.');
            }
            return payload;
        } catch {
            throw new WsException('Invalid credentials.');
        }
    }

    async decodeHeader(socket: Socket) {
        let auth_token = socket.handshake.headers.authorization;
        auth_token = auth_token.split(' ')[1];
        return await this.jwtService.decode(
            auth_token,
        );
    }

    async sendMessage(payload: any) {
        const roomchat = await this.roomchatRespository.findOne({
            where: {
                id: payload.roomchatId
            }
        });
        if (!roomchat) {
            throw new ForbiddenException(
                'This roomchat does not exist',
            );
        }
        const newMessage: MessageType = new MessageType()
        newMessage.id = uuidv5(payload.userId + payload.roomchatId + roomchat.data.length, uuidv5.URL);
        newMessage.content = payload.content;
        newMessage.userId = payload.userId;
        newMessage.fileUrl = payload.fileUrl;
        newMessage.isDisplay = true;
        roomchat.data.push(newMessage);
        await this.roomchatRespository.save(newMessage);
        return newMessage;
    }

    async removeMessage(payload: ValidateMessageDto) {
        const roomchat = await this.roomchatRespository.findOne({
            where: {
                id: payload.roomchatId
            }
        });
        if (!roomchat) {
            throw new ForbiddenException(
                'This roomchat does not exist',
            );
        }
        let count : number = 0;
        for (let i : number = 0; i < roomchat.data.length; i++) {
            if (roomchat.data[i].id == payload.messageId) {
                count = i;
                break;
            }
        }
        roomchat.data[count].isDisplay = false;
        await this.roomchatRespository.save(roomchat);
    }

    async createRoomchat(payload: CreateRoomDto) {
        const roomchat = this.roomchatRespository.create({
            id: uuidv5(payload.userId, uuidv5.URL),
            isDisplay: true,
            ownerUserId: payload.userId,
            member: [payload.userId, ...payload.member],
            data: [],
            memberOut: [],
            imgDisplay: payload.imgDisplay,
            description: payload.description
        })
        return await this.roomchatRespository.save(roomchat);
    }

    async validateRoomchat(payload: ValidateRoomDto) {
        const roomchat = await this.getRoomchatById(payload.roomchatId)
        roomchat.imgDisplay = payload.imgDisplay
        roomchat.description = payload.description
        return await this.roomchatRespository.save(roomchat);
    }
    async removeRoomChat(payload: ValidateRoomDto) {
        const roomchat = await this.getRoomchatById(payload.roomchatId)
        roomchat.isDisplay = false
        return await this.roomchatRespository.save(roomchat);
    }
    async validateMessage(payload: ValidateMessageDto) {
        const roomchat = await this.getRoomchatById(payload.roomchatId)
        let count : number = 0;
        for (let i : number = 0; i < roomchat.data.length; i++) {
            if (roomchat.data[i].id == payload.messageId) {
                count = i;
                break;
            }
        }
        roomchat.data[count].content = payload.content;
        roomchat.data[count].content = payload.fileUrl;
        await this.roomchatRespository.save(roomchat)
        return roomchat.data[count]
    }
    async getRoomchatById(roomchatId: string) {
        const roomchat =  await this.roomchatRespository.findOne({
            where: {
                id: roomchatId
            }
        });
        if (!roomchat) {
            throw new ForbiddenException(
                'This roomchat does not exist',
            );
        }
        return roomchat;
    }

    async addUserToRoomchat(addMemberRoom: MemberRoomDto) {
        const roomchat = await this.roomchatRespository.findOne({
            where: {
                id: addMemberRoom.roomchatId
            }
        });
        if (!roomchat) {
            throw new ForbiddenException(
                'This roomchat does not exist',
            );
        }
        roomchat.member.push(...addMemberRoom.member)
        roomchat.memberOut.filter(item => !addMemberRoom.member.includes(item.memberId))
        return await this.roomchatRespository.save(roomchat)
    }

    async removeUserFromRoomchat(removeMemberRoom: MemberRoomDto) {
        const roomchat = await this.roomchatRespository.findOne({
            where: {
                id: removeMemberRoom.roomchatId
            }
        });
        if (!roomchat) {
            throw new ForbiddenException(
                'This roomchat does not exist',
            );
        }
        roomchat.member.filter(item => !removeMemberRoom.member.includes(item))
        for (const item of roomchat.member) {
            const memberOut : MemberOutType = new MemberOutType();
            memberOut.memberId = item;
            memberOut.messageCount = roomchat.data.length;
            roomchat.memberOut.push(memberOut);
        }
        return await this.roomchatRespository.save(roomchat)
    }

    async addInteractMessage(payload: InteractMessageDto) {
        const roomchat= await this.getRoomchatById(payload.roomchatId)
        const newInteraction = new InteractionType();
        newInteraction.id = uuidv5(payload.userId + payload + roomchat.data.length, uuidv5.URL);
        newInteraction.content = payload.content;
        newInteraction.userId = payload.userId;
        newInteraction.isDisplay = true;
        let countComment: number = 0;
        for (let i : number = 0; i < roomchat.data.length; i++) {
            if (roomchat.data[i].id === payload.messageId) {
                countComment = i;
                break;
            }
        }
        roomchat.data[countComment].interaction.push(newInteraction);
        await this.roomchatRespository.save(roomchat);
        return roomchat.data[countComment];
    }

    async removeInteractMessage(payload: ValidateMessageDto) {
        const validateRoom = await this.getRoomchatById(payload.roomchatId)
        let countComment: number = 0;
        for (let i : number = 0; i < validateRoom.data.length; i++) {
            if (validateRoom.data[i].id === payload.messageId) {
                countComment = i;
                break;
            }
        }
        let countInteraction: number = 0;
        for (let i : number = 0; i < validateRoom.data[countComment].interaction.length; i++) {
            if (validateRoom.data[countComment].interaction[i].id === payload.interactionId) {
                countInteraction = i;
                break;
            }
        }
        validateRoom.data[countComment].interaction[countInteraction].isDisplay = false;
        await this.roomchatRespository.save(validateRoom);
    }

    async getAllRomchatByUserId(userId: string) {
        const dataMemberJoin = await this.roomchatRespository.find({
            where: {
                member: userId,
                isDisplay: true
            }
        });
        const dataMemberOut = await this.roomchatRespository.find({
            where: {
                isDisplay: true,
                memberOut: {
                    memberId: userId
                }
            }
        })
        for (let i : number = 0; i < dataMemberOut.length; i++) {
            let count = 0;
            for (let j = 0; j < dataMemberOut[i].memberOut.length; j++) {
                if (dataMemberOut[i].memberOut[j].memberId === userId) {
                    count = j;
                    break;
                }
            }
            dataMemberOut[i].data = dataMemberOut[i].data.slice(0, dataMemberOut[i].memberOut[count].messageCount)
        }
        const data = dataMemberJoin.concat(dataMemberOut);
        return data;
    }
}
