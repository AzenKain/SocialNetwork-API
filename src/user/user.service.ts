import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './type/user.entity'
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
    ChangePasswordDto,
    FriendDto,
    NotificationDto,
    ValidateUserDto,
    BookMarkDto,
    ForgetPasswordDto,
    ValidateOtpDto
} from './dto';
import { CommitEntity } from '../commit/commit.entity';
import { v5 as uuidv5 } from 'uuid';
import * as argon from 'argon2';
import { MailerService } from '@nestjs-modules/mailer';
import * as OTPAuth from "otpauth";
import * as otpGenerator from 'otp-generator';
import { OtpCode } from './type/otpCode.entity';


@Injectable()
export class UserService {
    constructor(
        private jwt: JwtService,
        private config: ConfigService,
        @InjectRepository(User) private userRepository: Repository<User>,
        @InjectRepository(CommitEntity) private commitRepository: Repository<CommitEntity>,
        @InjectRepository(OtpCode) private otpCodeRepository: Repository<OtpCode>,
        private readonly mailerService: MailerService
    ) { }

    async getAllUser(userId: string) {
        const user = await this.getUser(userId);
        if (user.role !== "ADMIN") {
            throw new ForbiddenException(
                'Request is denied',
            );
        }
        const dataUser = await this.userRepository.find({});
        for (let i = 0; i < dataUser.length; i++) {
            delete dataUser[i].hash;
            delete dataUser[i].refreshToken;
        }
        return dataUser;
    }

    async getUser(userId: string): Promise<User> {
        const user = await this.userRepository.findOne({
            where: {
                id: userId
            }
        });

        if (!user)
            throw new ForbiddenException(
                `This userId (${userId}) does not exist`,
            );
        if (user.role === "BANNED") {
            throw new ForbiddenException(
                `This userId had banned`,
            );
        }
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

    async addBookMark(payload: BookMarkDto) {
        const user = await this.userRepository.findOne({
            where: {
                id: payload.userId
            }
        });

        if (!user)
            throw new ForbiddenException(
                'This user does not exist',
            );
        if (user.role === "BANNED") {
            throw new ForbiddenException(
                `This userId had banned`,
            );
        }
        if (user.bookMarks == null) user.bookMarks = [];
        user.bookMarks.push(payload.bookMarkId);
        await this.userRepository.save(user);
        return { userId: payload.userId, bookmarkId: payload.bookMarkId }
    }

    async removeBookMark(payload: BookMarkDto) {
        const user = await this.userRepository.findOne({
            where: {
                id: payload.userId
            }
        });

        if (!user)
            throw new ForbiddenException(
                'This user does not exist',
            );
        if (user.bookMarks == null) user.bookMarks = [];
        user.bookMarks = user.bookMarks.filter(item => item !== payload.bookMarkId)
        await this.userRepository.save(user);
    }

    async changePassword(payload: ChangePasswordDto) {
        const user = await this.userRepository.findOne({
            where: {
                id: payload.userId
            }
        });

        if (!user)
            throw new ForbiddenException(
                'This user does not exist',
            );
        if (user.role === "BANNED") {
            throw new ForbiddenException(
                `This userId had banned`,
            );
        }
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
        user.detail.description = payload.description;
        user.detail.avatarUrl = payload.avatarUrl;
        return await this.userRepository.save(user);
    }

    async validatePrivacyUser(payload: ValidateUserDto) {
        const user = await this.getUser(payload.userId);
        user.detail.gender = payload.gender;
        user.detail.phoneNumber = payload.phoneNumber;
        user.detail.countryCode = payload.countryCode;
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

    async getFriendRequest(userId: string) {
        return await this.commitRepository.find({
            where: {
                createdUserId: userId,
                value: false,
                isDisplay: true
            }
        })
    }

    async getFriendReceive(userId: string) {
        return await this.commitRepository.find({
            where: {
                receiveUserId: userId,
                value: false,
                isDisplay: true
            }
        })
    }

    async deleteFriendCommit(userId: string, friendId: string) {
        const dataCre = await this.commitRepository.find({
            where: {
                isDisplay: true,
                createdUserId: userId,
                receiveUserId: friendId,
            }
        })
        if (dataCre) {
            for (let i = 0; i < dataCre.length; i++) {

                dataCre[i].isDisplay = false
                await this.commitRepository.save(dataCre[i])
            }
            return
        }
        else {
            const dataRec = await this.commitRepository.find({
                where: {
                    isDisplay: true,
                    createdUserId: friendId,
                    receiveUserId: userId,
                }
            })
            for (let i = 0; i < dataRec.length; i++) {

                dataRec[i].isDisplay = false
                await this.commitRepository.save(dataRec[i])
            }
            return
        }
    }

    async addFriend(payload: FriendDto) {
        const dataUser = await this.getUser(payload.userId);
        await this.getUser(payload.friendId);
        if (dataUser.friends.includes(payload.friendId)) {
            throw new ForbiddenException(
                'Request is denied',
            );
        }
        const tmpCommit = await this.commitRepository.findOne({
            where: {
                createdUserId: payload.userId,
                receiveUserId: payload.friendId,
            }
        })
        if (tmpCommit) {
            tmpCommit.isDisplay = true;
            tmpCommit.value = false;
            return await this.commitRepository.save(tmpCommit);
        }
        const newCommit = await this.commitRepository.create({
            id: uuidv5(payload.userId + payload.friendId, uuidv5.URL),
            createdUserId: payload.userId,
            receiveUserId: payload.friendId,
            value: false,
            isDisplay: true
        })
        return await this.commitRepository.save(newCommit)
    }

    async receiveFriend(payload: FriendDto) {
        const dataUser = await this.getUser(payload.userId);
        await this.getUser(payload.friendId);
        if (dataUser.friends.includes(payload.friendId)) {
            throw new ForbiddenException(
                'Request is denied',
            );
        }
        const newCommit = await this.commitRepository.find({
            where: {
                createdUserId: payload.friendId,
                receiveUserId: payload.userId,
                isDisplay: true
            }
        })

        if (newCommit.length == 0) {
            throw new ForbiddenException(
                'This user have not commit',
            );
        }
        for (let i = 0; i < newCommit.length; i++) {
            newCommit[i].value = true;
            newCommit[i].isDisplay = false;
            await this.commitRepository.save(newCommit[i]);
        }
        await this.addFriendToUser(payload.userId, payload.friendId)
        await this.addFriendToUser(payload.friendId, payload.userId)
        return newCommit[0];
    }

    async removeFriend(payload: FriendDto) {
        await this.removeFriendToUser(payload.friendId, payload.userId)
        await this.removeFriendToUser(payload.userId, payload.friendId)
        return await this.deleteFriendCommit(payload.userId, payload.friendId)
    }

    async removeNotification(payload: NotificationDto) {
        const user = await this.userRepository.findOne({
            where: {
                id: payload.userId,
            }
        });
        if (!user) {
            throw new ForbiddenException(
                `This userId does not exist`,
            );
        }

        if (user.role === "BANNED") {
            throw new ForbiddenException(
                `This user had banned`,
            );
        }
        const indexNoti = user.notification.findIndex(noti => noti.id === payload.notificationId)
        if (indexNoti === -1) {
            throw new ForbiddenException(
                'This notification does not exist',
            );
        }
        user.notification[indexNoti].isDisplay = false;
        await this.userRepository.save(user);
        delete user.hash;
        delete user.refreshToken;
        return user;
    }

    async createOtpCode(dto: ValidateOtpDto) {
        const dataOtp = await this.otpCodeRepository.findOne({
            where: {
                email: dto.type,
                isDisplay: true,
                type: dto.type,
            }
        })

        if (dataOtp) {
            const currentDate: Date = new Date();
            const thirtySecond = 60 * 1000;

            const isWithin30s = Math.abs(+new Date(dataOtp.created_at) - +currentDate) <= thirtySecond;

            if (!isWithin30s) {
                throw new ForbiddenException(
                    'Still counting down the time',
                );
            }

        }

        let generatedOTP: string = otpGenerator.generate(6, { digits: false, upperCaseAlphabets: false, specialChars: false });

        let totp = new OTPAuth.TOTP({
            algorithm: "SHA224",
            digits: 6,
            secret: generatedOTP,
        });

        let token: string = totp.generate().toString();
        let idOtp: string = uuidv5(dto.email + generatedOTP + token, uuidv5.URL)

        while (true) {
            const dataPreOtp = await this.otpCodeRepository.findOne({
                where: {
                    id: idOtp
                }
            })
            if (dataPreOtp) {
                generatedOTP = otpGenerator.generate(6, { digits: false, upperCaseAlphabets: false, specialChars: false });
                totp = new OTPAuth.TOTP({
                    algorithm: "SHA224",
                    digits: 6,
                    secret: generatedOTP,
                });

                token = totp.generate().toString();
                idOtp = uuidv5(dto.email + generatedOTP + token, uuidv5.URL)
            }
            else {
                break;
            }
        }
        if (dataOtp) {
            dataOtp.otpCode = token;
            dataOtp.id = idOtp
            dataOtp.value = false;
            await this.otpCodeRepository.save(dataOtp);
        }
        else {
            const newOtp = await this.otpCodeRepository.create({
                id: idOtp,
                email: dto.email,
                otpCode: token,
                isDisplay: true,
                value: false,
                type: dto.type,
            })

            await this.otpCodeRepository.save(newOtp)
        }
        if (dto.type == "ForgotPassword") {
            const user = await this.userRepository.findOne({
                where: {
                    email: dto.email
                }
            });

            if (!user)
                throw new ForbiddenException(
                    `This userId does not exist`,
                );
            if (user.role === "BANNED") {
                throw new ForbiddenException(
                    `This user had banned`,
                );
            }
            delete user.hash;
            delete user.refreshToken;
            await this.mailerService.sendMail({
                to: dto.email,
                subject: 'Otp Forget Password Black Cat Chat',
                template: 'forgetPassword',
                context: {
                    username: user.detail.name,
                    code: token
                },
            });
            return { isRequest: true }
        }
        else if (dto.type == "SignUp") {
            await this.mailerService.sendMail({
                to: dto.email,
                subject: 'Otp Create Account Black Cat Chat',
                template: 'createAccount',
                context: {
                    code: token
                },
            });
            return { isRequest: true }
        }
        return { isRequest: false }
    }

    async validateOptCode(dto: ValidateOtpDto) {
        const dataOtp = await this.otpCodeRepository.findOne({
            where: {
                email: dto.email,
                isDisplay: true,
                type: dto.type,
                otpCode: dto.otpCode,
                value: false,
            }
        })

        if (!dataOtp) {
            throw new ForbiddenException(
                'The user have not OTP CODE',
            );
        }
        dataOtp.value = true;
        dataOtp.isDisplay = false;
        await this.otpCodeRepository.save(dataOtp);
        return { isRequest: true, otpId: dataOtp.id }
    }

    async forgetPasswordValidate(dto: ForgetPasswordDto) {
        const user = await this.userRepository.findOne({
            where: {
                email: dto.email
            }
        });

        if (!user)
            throw new ForbiddenException(
                `This email does not exist`,
            );
        if (user.role === "BANNED") {
            throw new ForbiddenException(
                `This user had banned`,
            );
        }
        const dataOtp = await this.otpCodeRepository.findOne({
            where: {
                id: dto.otpId,
                email: dto.email,
                type: "ForgotPassword"
            }
        })

        if (!dataOtp) {
            throw new ForbiddenException(
                'The user have not OTP CODE',
            );
        }
        if (dto.newPassword != dto.validatePassword) {
            throw new ForbiddenException(
                'New password do not match',
            );
        }

        if (dataOtp.value == false) {
            throw new ForbiddenException(
                'Otp not validate',
            );
        }

        await this.otpCodeRepository.save(dataOtp)

        const hash = await argon.hash(dto.newPassword);
        user.hash = hash;
        await this.userRepository.save(user);

        delete user.hash;
        delete user.refreshToken
        return user;
    }
}
