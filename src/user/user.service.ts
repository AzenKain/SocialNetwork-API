import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './type/user.entity'
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ChangePasswordDto, FriendDto, NotificationDto, ValidateUserDto } from './dto';
import { CommitEntity } from './type/commit.entity';
import { v5 as uuidv5 } from 'uuid';
import { NotificationType } from './type/notification.type';
import * as argon from 'argon2';

@Injectable()
export class UserService {
    constructor(
        private jwt: JwtService,
        private config: ConfigService,
        @InjectRepository(User) private userRepository: Repository<User>,
        @InjectRepository(User) private commitRepository: Repository<CommitEntity>,
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
    }
    async removeFriendToUser(userId: string, friendId: string) {
        const user = await this.getUser(userId);
        user.friends.filter(item => item !== friendId)
        return await this.userRepository.save(user);
    }

    async addFriend(payload : FriendDto) {
        const newCommit = await this.commitRepository.create({
            id : uuidv5(payload.userId + payload.friendId, uuidv5.URL),
            createdUserId: payload.userId,
            receiveUserId: payload.friendId,
            value: false
        })
        return await this.userRepository.save(newCommit)
    }

    async receiveFriend(payload : FriendDto) {
        const newCommit = await this.commitRepository.findOne({
            where: {
                createdUserId: payload.friendId,
            }
        })
        newCommit.value = true;
        await this.addFriendToUser(payload.userId, payload.friendId)
        await this.addFriendToUser(payload.friendId, payload.userId)
        return await this.userRepository.save(newCommit)
    }

    async removeFriend(payload : FriendDto) {
        await this.removeFriendToUser(payload.friendId, payload.userId)
        return await this.removeFriendToUser(payload.userId, payload.friendId)
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
