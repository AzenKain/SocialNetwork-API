import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './type/user.entity'
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ChangePasswordDto, FriendDto, NotificationDto, ValidateUserDto } from './dto';
import { CommitEntity } from '../commit/commit.entity';
import { v5 as uuidv5 } from 'uuid';
import { NotificationType } from './type/notification.type';
import * as argon from 'argon2';


@Injectable()
export class UserService {
    constructor(
        private jwt: JwtService,
        private config: ConfigService,
        @InjectRepository(User) private userRepository: Repository<User>,
        @InjectRepository(CommitEntity) private commitRepository: Repository<CommitEntity>,
    ) {}
    
    async getUser(userId: string): Promise<User> {
        const user = await this.userRepository.findOne({
            where : {
                id : userId
            }
        });

        if (!user)
            throw new ForbiddenException(
                'This user does not exist',
            );
        delete user.hash;
        delete user.refreshToken;
        return user;
    }
    async findUser(content: string) {
        if (content.includes('@')) {
            const dataRe = await this.userRepository.find({
                where: {
                    email: content
                }
            })
            for (const userIndex in dataRe) {
                delete dataRe[userIndex].hash
                delete dataRe[userIndex].refreshToken
            }
            return dataRe
        }
        else {
            const dataUser = await this.userRepository.find({})
            const dataRe = [];
            for (const userIndex in dataUser) {
                if (!('detail' in dataUser[userIndex])) continue;
                if (dataUser[userIndex].detail.name && dataUser[userIndex].detail.name.toLowerCase().includes(content.toLowerCase())) {
                    delete dataUser[userIndex].hash
                    delete dataUser[userIndex].refreshToken
                    dataRe.push(dataUser[userIndex])
                }
                else if (dataUser[userIndex].detail.nickName && dataUser[userIndex].detail.nickName.toLowerCase().includes(content.toLowerCase())) {
                    delete dataUser[userIndex].hash
                    delete dataUser[userIndex].refreshToken
                    dataRe.push(dataUser[userIndex])
                }
            }
            return dataRe
        }
    }
    async changePassword(payload: ChangePasswordDto) {
        const user = await this.userRepository.findOne({
            where : {
                id : payload.userId
            }
        });

        if (!user)
            throw new ForbiddenException(
                'This user does not exist',
            );
        const pwMatches = await argon.verify(
            user.hash,
            payload.currentPassword
        );

        if (!pwMatches)
            throw new ForbiddenException(
                'Wrong the past password',
            );

        if (payload.newPassword != payload.validatePassword) {
            throw new ForbiddenException(
                'New password do not match',
            );
        }

        const hash = await argon.hash(payload.newPassword);
        user.hash = hash;
        await this.userRepository.save(user);

        delete user.hash;
        delete user.refreshToken
        return user;
    }
    async validateUser(payload: ValidateUserDto) {
        const user = await this.getUser(payload.userId);
        if (payload.name !== null) user.detail.name = payload.name;
        user.detail.nickName = payload.nickName;
        user.detail.birthday = payload.birthday;
        user.detail.phoneNumber = payload.phoneNumber;
        user.detail.description = payload.description;
        user.detail.age = payload.age;
        user.detail.avatarUrl = payload.avatarUrl;
        return await this.userRepository.save(user);
    }

    async addFriendToUser(userId: string, friendId: string) {
        const user = await this.getUser(userId);
        user.friends.push(friendId);
        return await this.userRepository.save(user);
    }
    

    async removeFriendToUser(userId: string, friendId: string) {
        const user = await this.getUser(userId);
        user.friends = user.friends.filter(item => item !== friendId)
        return await this.userRepository.save(user);
    }

    async getFriendRequest(userId : string) {
        const dataCre =  await this.commitRepository.find({
            where: {
                createdUserId: userId,
                value: false,
                isDisplay: true
            }
        })       
        const dataRec = await this.commitRepository.find({
            where: {
                receiveUserId: userId,
                value: false,
                isDisplay: true
            }
        })
        const dataReturn = [...dataRec, ...dataCre]
        return dataReturn
    }

    async deleteFriendCommit(userId: string, friendId: string) {
        const dataCre = await this.commitRepository.findOne({
            where: {
                isDisplay: true,
                createdUserId: userId,
                receiveUserId: friendId,
            }
        })
        if (dataCre) {
            dataCre.isDisplay = false
            return this.commitRepository.save(dataCre)
        }
        else {
            const dataRec = await this.commitRepository.findOne({
                where: {
                    isDisplay: true,
                    createdUserId: friendId,
                    receiveUserId: userId,
                }
            })
            dataRec.isDisplay = false
            return this.commitRepository.save(dataRec)
        }
        
    }

    async addFriend(payload : FriendDto) {
        const newCommit = await this.commitRepository.create({
            id : uuidv5(payload.userId + payload.friendId, uuidv5.URL),
            createdUserId: payload.userId,
            receiveUserId: payload.friendId,
            value: false,
            isDisplay: true
        })
        return await this.commitRepository.save(newCommit)
    }

    async receiveFriend(payload : FriendDto) {
        const newCommit = await this.commitRepository.findOne({
            where: {
                createdUserId: payload.friendId,
                isDisplay: true
            }
        })
        newCommit.value = true;
        await this.addFriendToUser(payload.userId, payload.friendId)
        await this.addFriendToUser(payload.friendId, payload.userId)
        return await this.commitRepository.save(newCommit)
    }

    async removeFriend(payload : FriendDto) {
        await this.removeFriendToUser(payload.friendId, payload.userId)
        await this.removeFriendToUser(payload.userId, payload.friendId)
        return await this.deleteFriendCommit(payload.userId, payload.friendId)
    }

    async addNotification(payload : NotificationDto) {
        const user = await this.getUser(payload.userId);
        const newNotification : NotificationType = new NotificationType();
        newNotification.id = uuidv5(payload.userId + user.notification.length, uuidv5.URL)
        newNotification.content = payload.content;
        newNotification.type = payload.type;
        newNotification.fileUrl = payload.fileUrl;
        user.notification.push(newNotification);
        return await this.userRepository.save(user);
    }
}
