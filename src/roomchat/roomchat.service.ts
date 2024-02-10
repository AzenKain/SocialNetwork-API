import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Socket } from 'socket.io';
import { Roomchat } from './type/romchat.entity';
import { Repository } from 'typeorm';
import { v5 as uuidv5 } from 'uuid';
import { MemberRoomDto, CreateRoomDto, InteractMessageDto, ValidateMessageDto, ValidateRoomDto, ValidateMemberDto } from './dto';
import { MessageType } from 'src/message/message.type';
import { MemberOutType, MemberRoleType } from './type/romchat.type';
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
        if (roomchat.isSingle && roomchat.isBlock != null) {
            throw new ForbiddenException(
                'The user has no permission',
            );
        }
        if (!(roomchat.member.includes(payload.userId))) {
            throw new ForbiddenException(
                'The user has no permission',
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
        if (roomchat.isSingle) {
            if (roomchat.role.ADMIN.findIndex(user => user.memberId === payload.userId) === -1 
            && roomchat.role.MOD.findIndex(user => user.memberId === payload.userId) === -1 
            ) {
                throw new ForbiddenException(
                    'The user has no permission',
                );
            }
            else if (roomchat.data[indexMeg].userId !== payload.userId) {
                throw new ForbiddenException(
                    'The user has no permission',
                );
            }
        } 
        else if (roomchat.data[indexMeg].userId !== payload.userId) {
            throw new ForbiddenException(
                'The user has no permission',
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
        if (validateUser.role === "BANNED") {
            throw new ForbiddenException(
                `This user had banned`,
            );
        }
        delete validateUser.hash;
        delete validateUser.refreshToken;
        if (new Date(validateUser.premiumTime) < new Date() && payload.member.length > 50) {
            throw new ForbiddenException(
                'Basic users must only create room under 50 members',
            );
        }
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

        const adminRole : MemberRoleType[] = [];
        if (payload.isSingle) {
            const adminTmp1 : MemberRoleType = new MemberRoleType();
            const adminTmp2 : MemberRoleType = new MemberRoleType();
            adminTmp1.memberId = payload.userId;
            adminTmp1.created_at = new Date();
            adminTmp1.updated_at = new Date();
            adminRole.push(adminTmp1);
            if (payload.member.length == 0) return;
            adminTmp2.memberId = payload.member[0];
            adminTmp2.created_at = new Date();
            adminTmp2.updated_at = new Date();
            adminRole.push(adminTmp2);
        }
        else {
            const adminTmp1 : MemberRoleType = new MemberRoleType();
            adminTmp1.memberId = payload.userId;
            adminTmp1.created_at = new Date();
            adminTmp1.updated_at = new Date();
            adminRole.push(adminTmp1);
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
            description: payload.description,
            isBlock: null,
            memberNickname: {},
            role: {ADMIN : adminRole, MOD: []}
        })

        return await this.roomchatRespository.save(roomchat);
    }

    async validateRoomchat(payload: ValidateRoomDto) {
        const roomchat = await this.getRoomchatById(payload.roomchatId)
        if (roomchat.role.ADMIN.findIndex(user => user.memberId === payload.userId) === -1 
            && roomchat.role.MOD.findIndex(user => user.memberId === payload.userId) === -1 
        ) {
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
        if (roomchat.role.ADMIN.findIndex(user => user.memberId === payload.userId) === -1 
        ) {
            throw new ForbiddenException(
                'The user has no permission',
            );
        }
        roomchat.isDisplay = false
        return await this.roomchatRespository.save(roomchat);
    }

    async blockRoomchat(payload: ValidateRoomDto) {
        const roomchat = await this.getRoomchatById(payload.roomchatId)
        if (roomchat.isSingle == false) {
            throw new ForbiddenException(
                'The user has no permission',
            );
        }
        if (roomchat.role.ADMIN.findIndex(user => user.memberId === payload.userId) === -1 
        ) {
            throw new ForbiddenException(
                'The user has no permission',
            );
        }

        roomchat.isBlock = payload.userId;
        return await this.roomchatRespository.save(roomchat);
    }

    async unblockRoomchat(payload: ValidateRoomDto) {
        const roomchat = await this.getRoomchatById(payload.roomchatId)
        if (roomchat.isSingle == false) {
            throw new ForbiddenException(
                'The user has no permission',
            );
        }
        if (roomchat.role.ADMIN.findIndex(user => user.memberId === payload.userId) === -1 
        ) {
            throw new ForbiddenException(
                'The user has no permission',
            );
        }
        if (roomchat.isBlock != payload.userId) {
            throw new ForbiddenException(
                'The user has no permission',
            );
        }
        roomchat.isBlock = null;
        return await this.roomchatRespository.save(roomchat);
    }

    async validateMemberNickname (payload: ValidateMemberDto) {
        const roomchat = await this.getRoomchatById(payload.roomchatId)
        if (!(roomchat.member.includes(payload.userId))) {
            throw new ForbiddenException(
                'The user has no permission',
            );
        }
        roomchat.memberNickname[payload.userId] = payload.nickName;
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
        if (roomchat.data[indexMeg].userId !== payload.userId) {
            throw new ForbiddenException(
                'The user has no permission',
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

    async addModRoomchat(payload: MemberRoomDto) {
        const roomchat = await this.roomchatRespository.findOne({
            where: {
                id: payload.roomchatId,
                isDisplay: true,
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
        if (roomchat.role.ADMIN.findIndex(user => user.memberId === payload.userId) === -1 
        ) {
            throw new ForbiddenException(
                'The user has no permission',
            );
        }
        for (let i = 0; i < payload.member.length; i++) {
            if (roomchat.role.MOD.findIndex(item => item.memberId === payload.member[i]) !== -1) continue;
            const tmpUser : MemberRoleType = new MemberRoleType();
            tmpUser.memberId = payload.member[i];
            tmpUser.created_at = new Date();
            tmpUser.updated_at = new Date();
            roomchat.role.MOD.push(tmpUser);
        }
        const dataReturn = await this.roomchatRespository.save(roomchat)
        return dataReturn
    }
    
    async removeModRoomchat(payload: MemberRoomDto) {
        const roomchat = await this.roomchatRespository.findOne({
            where: {
                id: payload.roomchatId,
                isDisplay: true,
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
        if (roomchat.role.ADMIN.findIndex(user => user.memberId === payload.userId) === -1 
        ) {
            throw new ForbiddenException(
                'The user has no permission',
            );
        }
        roomchat.role.MOD = roomchat.role.MOD.filter(user => !payload.member.includes(user.memberId));
        const dataReturn =  await this.roomchatRespository.save(roomchat)
        return dataReturn
    }

    async addUserToRoomchat(addMemberRoom: MemberRoomDto) {
        const roomchat = await this.roomchatRespository.findOne({
            where: {
                id: addMemberRoom.roomchatId,
                isDisplay: true
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
        const validateUser = await this.userRespository.findOne({
            where: {
                id: roomchat.ownerUserId
            }
        })

        if (!validateUser) {
            throw new ForbiddenException(
                `This owner room does not exist`,
            );
        }

        delete validateUser.hash;
        delete validateUser.refreshToken;
        if (new Date(validateUser.premiumTime) < new Date() && roomchat.member.length > 50) {
            throw new ForbiddenException(
                'The current room owner is a basic user, so the room cannot have more than 50 members',
            );
        }

        if (roomchat.role.ADMIN.findIndex(user => user.memberId === addMemberRoom.userId) === -1 
        && roomchat.role.MOD.findIndex(user => user.memberId === addMemberRoom.userId) === -1 
        ) {
            throw new ForbiddenException(
                'The user has no permission',
            );
        }
        for (let i = 0; i < addMemberRoom.member.length; i++) {
            if (roomchat.member.includes(roomchat.member[i])) continue;
            roomchat.member.push(roomchat.member[i]);
        }
        roomchat.memberOut = roomchat.memberOut.filter(item => !addMemberRoom.member.includes(item.memberId))
        return await this.roomchatRespository.save(roomchat)
    }

    async removeUserFromRoomchat(removeMemberRoom: MemberRoomDto) {
        const roomchat = await this.roomchatRespository.findOne({
            where: {
                id: removeMemberRoom.roomchatId,
                isDisplay: true
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
        if (removeMemberRoom.member.length > 1 || removeMemberRoom.userId !== removeMemberRoom.member[0]) { 
            if (roomchat.role.ADMIN.findIndex(user => user.memberId === removeMemberRoom.userId) === -1 
            && roomchat.role.MOD.findIndex(user => user.memberId === removeMemberRoom.userId) === -1 
            ) {
                throw new ForbiddenException(
                    'The user has no permission',
                );
            }
        }
        else if (removeMemberRoom.userId !== removeMemberRoom.member[0])  {
            throw new ForbiddenException(
                'The user has no permission',
            );
        }
        roomchat.member = roomchat.member.filter(item => !removeMemberRoom.member.includes(item))
        roomchat.role.ADMIN = roomchat.role.ADMIN.filter(item => !removeMemberRoom.member.includes(item.memberId))
        roomchat.role.MOD = roomchat.role.MOD.filter(item => !removeMemberRoom.member.includes(item.memberId))
        if (roomchat.role.ADMIN.length == 0) {
            if (roomchat.role.MOD.length !== 0) {
                roomchat.role.ADMIN.push(roomchat.role.MOD[0])
                roomchat.role.MOD = roomchat.role.MOD.filter(item => item.memberId !== roomchat.role.MOD[0].memberId)
            }
        }
        for (const item of roomchat.member) {
            const memberOut : MemberOutType = new MemberOutType();
            memberOut.memberId = item;
            memberOut.messageCount = roomchat.data.length;
            memberOut.created_at = new Date();
            memberOut.updated_at = new Date();
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
