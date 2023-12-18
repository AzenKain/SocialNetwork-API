import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './type/user.entity'
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { FriendDto, NotificationDto } from './dto';
import { CommitEntity } from './type/commit.entity';
import { v5 as uuidv5 } from 'uuid';
import { NotificationType } from './type/notification.type';


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
