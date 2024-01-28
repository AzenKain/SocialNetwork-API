import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Socket } from 'socket.io';
import { Roomchat } from './type/romchat.entity';
import { Repository } from 'typeorm';
import { v5 as uuidv5 } from 'uuid';
import { MemberRoomDto, CreateRoomDto, InteractMessageDto, ValidateMessageDto, ValidateRoomDto } from './dto';
import { MessageType } from 'src/message/message.type';
import { MemberOutType } from './type/romchat.type';
import { InteractionType } from 'src/interaction/interaction.type';
import { User } from 'src/user/type/user.entity';;
import * as otpGenerator from 'otp-generator';

@Injectable()
export class RoomchatService {
    constructor(
        private readonly jwtService: JwtService,
        private config: ConfigService,
        @InjectRepository(Roomchat) private roomchatRespository: Repository<Roomchat>,
        @InjectRepository(User) private userRespository: Repository<User>,
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
                return null;
            }
            return payload;
        } catch {
            return null;
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
        let generatedOTP: string = otpGenerator.generate(10, {digits: false, upperCaseAlphabets: false, specialChars: false });
        let megsId: string = uuidv5(payload.userId + payload.roomchatId + roomchat.data.length + generatedOTP, uuidv5.URL);

        while (true) {
            if (roomchat.data.findIndex(comment => comment.id === megsId) !== -1) {
                generatedOTP = otpGenerator.generate(10, {digits: false, upperCaseAlphabets: false, specialChars: false });
                megsId = uuidv5(payload.userId + payload.roomchatId + roomchat.data.length + generatedOTP, uuidv5.URL);
            }
            else {
                break;
            }
        }
        const newMessage: MessageType = new MessageType()
        newMessage.id = megsId;
        newMessage.content = payload.content;
        newMessage.userId = payload.userId;
        if (!payload.fileUrl) {
            newMessage.fileUrl = []
        } 
        else {
            newMessage.fileUrl = payload.fileUrl;
        }
        newMessage.roomId = payload.roomchatId;
        newMessage.isDisplay = true;
        newMessage.interaction = [];
        newMessage.created_at = new Date();
        newMessage.updated_at = new Date();
        roomchat.data.push(newMessage);
        await this.roomchatRespository.save(roomchat);
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
        const indexMeg = roomchat.data.findIndex(comment => comment.id === payload.messageId);
        if (indexMeg == -1) {
            throw new ForbiddenException(
                'This messages does not exist',
            );
        }
        roomchat.data[indexMeg].isDisplay = false;
        await this.roomchatRespository.save(roomchat);
    }

    async createRoomchat(payload: CreateRoomDto) {
        const validateUser = await this.userRespository.findOne({
            where: {
                id: payload.userId
            }
        })

        if (!validateUser) {
            throw new ForbiddenException(
                `This userId (${payload.userId}) does not exist`,
            );
        }
        
        delete validateUser.hash;
        delete validateUser.refreshToken;
        const sortedMembers = [payload.userId, ...payload.member].sort()
        if (payload.isSingle == true) {
            const roomchatCre = await this.roomchatRespository.findOne({
                where: {
                    isSingle: payload.isSingle,
                    title: payload.member[0] + payload.userId
                }
            })
            if (roomchatCre) {
                return roomchatCre;
            }
            const roomchatRe = await this.roomchatRespository.findOne({
                where: {
                    isSingle: payload.isSingle,
                    title: payload.userId + payload.member[0]
                }
            })
            if (roomchatRe) {
                return roomchatRe;
            }
        }
       
        let generatedOTP: string = otpGenerator.generate(10, {digits: false, upperCaseAlphabets: false, specialChars: false });
        let roomId: string = uuidv5(payload.userId + payload.title + payload.member.length + generatedOTP, uuidv5.URL);

        while (true) {
            const roomSelect =  await this.roomchatRespository.findOne({
                where: {
                    id: roomId
                }
            });
            if (roomSelect) {
                generatedOTP = otpGenerator.generate(10, {digits: false, upperCaseAlphabets: false, specialChars: false });
                roomId = uuidv5(payload.userId + payload.title + payload.member.length + generatedOTP, uuidv5.URL)
            }
            else {
                break;
            }
        }
     
        const roomchat = this.roomchatRespository.create({
            id: roomId,
            isDisplay: true,
            isSingle: payload.isSingle,
            ownerUserId: payload.userId,
            title: payload.title,
            member: sortedMembers, 
            data: [],
            memberOut: [],
            imgDisplay: payload.imgDisplay,
            description: payload.description
        })

        return await this.roomchatRespository.save(roomchat);
    }

    async validateRoomchat(payload: ValidateRoomDto) {
        const roomchat = await this.getRoomchatById(payload.roomchatId)
        if (roomchat.ownerUserId != payload.userId) {
            throw new ForbiddenException(
                'The user has no permission',
            );
        }
        roomchat.imgDisplay = payload.imgDisplay
        roomchat.description = payload.description
        if (roomchat.isSingle == false) {
            roomchat.title = payload.title;
        }
        return await this.roomchatRespository.save(roomchat);
    }

    async removeRoomChat(payload: ValidateRoomDto) {
        const roomchat = await this.getRoomchatById(payload.roomchatId)
        if (roomchat.isSingle == true) {
            throw new ForbiddenException(
                'The user has no permission',
            );
        }
        if (roomchat.ownerUserId != payload.userId) {
            throw new ForbiddenException(
                'The user has no permission',
            );
        }
 
        roomchat.isDisplay = false
        return await this.roomchatRespository.save(roomchat);
    }

    async validateMessage(payload: ValidateMessageDto) {
        const roomchat = await this.getRoomchatById(payload.roomchatId)
        const indexMeg = roomchat.data.findIndex(comment => comment.id === payload.messageId);
        if (indexMeg == -1) {
            throw new ForbiddenException(
                'This messages does not exist',
            );
        }
        roomchat.data[indexMeg].content = payload.content;
        roomchat.data[indexMeg].content = payload.fileUrl;
        await this.roomchatRespository.save(roomchat)
        return roomchat.data[indexMeg]
    }

    async getRoomchatById(roomchatId: string) {
        const roomchat =  await this.roomchatRespository.findOne({
            where: {
                id: roomchatId,
                isDisplay: true,
            }
        });
        if (!roomchat) {
            throw new ForbiddenException(
                'This roomchat does not exist',
            );
        }
        return roomchat;
    }

    async getRoomchatByTitle(roomchatTitle: string) {
        const roomchat =  await this.roomchatRespository.findOne({
            where: {
                title: roomchatTitle,
                isDisplay: true,
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
        if (roomchat.isSingle == true) {
            throw new ForbiddenException(
                'The user has no permission',
            );
        }
        roomchat.member.push(...addMemberRoom.member)
        roomchat.memberOut = roomchat.memberOut.filter(item => !addMemberRoom.member.includes(item.memberId))
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
        if (roomchat.isSingle == true) {
            throw new ForbiddenException(
                'The user has no permission',
            );
        }
        roomchat.member = roomchat.member.filter(item => !removeMemberRoom.member.includes(item))
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
        const indexMeg = roomchat.data.findIndex(comment => comment.id === payload.messageId);
        if (indexMeg == -1) {
            throw new ForbiddenException(
                'This messages does not exist',
            );
        }
        let generatedOTP: string = otpGenerator.generate(10, {digits: false, upperCaseAlphabets: false, specialChars: false });
        let interactionId: string = uuidv5(payload.userId + payload + roomchat.data.length + generatedOTP, uuidv5.URL);
        while (true) {
            if (roomchat.data[indexMeg].interaction.findIndex(inter => inter.id === interactionId) !== -1) {
                generatedOTP = otpGenerator.generate(10, {digits: false, upperCaseAlphabets: false, specialChars: false });
                interactionId = uuidv5(payload.userId + payload + roomchat.data.length + generatedOTP, uuidv5.URL);
            }
            else {
                break;
            }
        }
        const newInteraction = new InteractionType();
        newInteraction.id = interactionId;
        newInteraction.content = payload.content;
        newInteraction.userId = payload.userId;
        newInteraction.isDisplay = true;
        roomchat.data[indexMeg].interaction.push(newInteraction);
        await this.roomchatRespository.save(roomchat);
        return roomchat.data[indexMeg];
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
                isDisplay: true,
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
