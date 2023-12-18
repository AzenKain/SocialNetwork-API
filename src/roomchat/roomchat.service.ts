import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { Roomchat } from './romchat.entity';
import { Repository } from 'typeorm';
import { v5 as uuidv5 } from 'uuid';
import { MemberRoomDto, CreateRoomDto } from './dto';
import { MessageType } from 'src/message/message.type';
import { MemberOutType } from './romchat.type';


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

    async removeMessage(payload: any) {
        const roomchat = await this.roomchatRespository.findOne({
            where: {
                id: payload.roomchatId
            }
        });
        const dataReturn = roomchat.data[roomchat.data.indexOf(payload.msgId)].isDisplay = false;
        await this.roomchatRespository.save(roomchat);
        return dataReturn;
    }
    
    async createRoomchat(payload: CreateRoomDto) {
        const roomchat = this.roomchatRespository.create({
            id: uuidv5(payload.userId, uuidv5.URL),
            isSingle: payload.isSingle,
            ownerUserId: payload.userId,
            member: [payload.userId, ...payload.member],
            data: [],
            memberOut: []
        })
        return await this.roomchatRespository.save(roomchat);
    }

    async getRoomchatById(roomchatId: string) {
        return await this.roomchatRespository.findOne({
            where: {
                id: roomchatId
            }
        });
    }

    async addUserToRoomchat(addMemberRoom: MemberRoomDto) {
        const roomchat = await this.roomchatRespository.findOne({
            where: {
                id: addMemberRoom.roomchatId
            }
        });

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
        roomchat.member.filter(item => !removeMemberRoom.member.includes(item))
        for (const item of roomchat.member) {
            const memberOut : MemberOutType = new MemberOutType();
            memberOut.memberId = item;
            memberOut.messageCount = roomchat.data.length;
            roomchat.memberOut.push(memberOut);
        }
        return await this.roomchatRespository.save(roomchat)
    }

    async getAllRomchatByUserId(userId: string) {
        const dataMemberJoin = await this.roomchatRespository.find({
            where: {
                member: userId
            }
        });
        const dataMemberOut = await this.roomchatRespository.find({
            where: {
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
