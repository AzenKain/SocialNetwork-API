import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as argon from 'argon2';
import { v5 as uuidv5 } from 'uuid';
import { v4 as uuidv4 } from 'uuid';
import { AdminDto, AuthDto, CommandDto, SignUpDto } from './dto';
import { ProfileType } from 'src/user/type/user.type';
import { User } from '../user/type/user.entity';
import { OtpCode } from 'src/user/type/otpCode.entity';

@Injectable()
export class AuthService {
    constructor(
        private jwt: JwtService,
        private config: ConfigService,
        @InjectRepository(User) private userRespository: Repository<User>,
        @InjectRepository(OtpCode) private otpCodeRepository: Repository<OtpCode>,
    ) { }

    async addAdmin(dto: AdminDto) {
        const userAdmin = await this.userRespository.findOne({
            where: {
                id: dto.userId,
            }
        });

        if (!userAdmin) {
            throw new ForbiddenException(
                'This user does not exist',
            );
        }
        
        if (dto.secretKey != this.config.get('JWT_REFRESH_SECRET')) {
            throw new ForbiddenException(
                'You have no authority',
            );
        }
        
        userAdmin.role = "ADMIN";
        this.userRespository.save(userAdmin);
        return {status: true}
    }

    async commandAdmin(command : CommandDto) {
        const userAdmin = await this.userRespository.findOne({
            where: {
                id: command.adminId,
            }
        });

        if (!userAdmin) {
            throw new ForbiddenException(
                'This admin does not exist',
            );
        }

        if (userAdmin.role !== "ADMIN") {
            throw new ForbiddenException(
                'You have no authority',
            );
        }

        const userSelect = await this.userRespository.findOne({
            where: {
                id: command.userId,
            }
        });

        if (!userSelect)
        throw new ForbiddenException(
            'This user does not exist',
        );

        if (command.command === "REMOVEADMIN") {
            userSelect.role = "USER";
            this.userRespository.save(userSelect);
            return {status: true}
        }

        if (userSelect.role === "ADMIN") {
            throw new ForbiddenException(
                'You have no authority',
            );
        }
        if (command.command === "BANNED") {
            userSelect.role = "BANNED";
            this.userRespository.save(userSelect);
        }

        if (command.command === "UNBANNED") {
            userSelect.role = "UNBANNED";
            this.userRespository.save(userSelect);
        }
        return {status: true}
    }

    async Login(userDto: AuthDto) {
        const userLogin = await this.userRespository.findOne({
            where: {
                email: userDto.email
            }
        });
        if (!userLogin)
            throw new ForbiddenException(
                'This user does not exist',
            );

        if (userLogin.role === "BANNED") {
            throw new ForbiddenException(
                `This user had banned`,
            );
        }
        const pwMatches = await argon.verify(
            userLogin.hash,
            userDto.password,
        );

        if (!pwMatches)
            throw new ForbiddenException(
                'Wrong password',
            );
        const token = await this.signToken(userLogin.id, userLogin.email)
        await this.updateRefreshToken(userLogin.id, token.refresh_token)
        return token;
    }

    async Logout(userId: string) {
        await this.updateRefreshToken(userId, null);
        return null;
    }

    async Signup(userDto: SignUpDto) {
        const valueGender = ["male", "female", "other"];
        if (userDto.gender != null && !valueGender.includes(userDto.gender)) {
            throw new ForbiddenException(
                'Gender is not validate',
            );
        }
        if (userDto.countryCode != null && !userDto.countryCode.startsWith("+")) {
            throw new ForbiddenException(
                'CountryCode is not validate',
            );
        }
        const checkMail = await this.userRespository.findOne({
            where: {
                email: userDto.email,
            }
        })

        if (checkMail != null) {
            throw new ForbiddenException(
                'This email was existed before',
            );
        }
        const dataOtp = await this.otpCodeRepository.findOne({
            where: {
                id: userDto.otpId,
                email: userDto.email,
                type: "SignUp"
            }
        })

        if (!dataOtp) {
            throw new ForbiddenException(
                'The user have not OTP CODE',
            );
        }
        const hash = await argon.hash(userDto.password);

        const detailUser = new ProfileType()
        detailUser.name = userDto.name;
        detailUser.phoneNumber = userDto.phoneNumber;
        detailUser.birthday = userDto.birthday;
        detailUser.gender = userDto.gender;
        detailUser.countryCode = userDto.countryCode;
        detailUser.avatarUrl = null;
        detailUser.description = null;


        const UserCre = this.userRespository.create({
            id: uuidv5(userDto.email, uuidv5.URL),
            email: userDto.email,
            hash,
            refreshToken: uuidv4(),
            isOnline: false,
            notification: [],
            friends: [],
            detail: detailUser,
            bookMarks: [],
            role: "USER"
        })

        const newUser = await this.userRespository.save(UserCre);
        const token = await this.signToken(newUser.id, newUser.email)
        await this.updateRefreshToken(newUser.id, token.refresh_token)
        return token;
    }
    async updateRefreshToken(userId: string, refreshToken: string) {
        const user  = await this.userRespository.findOne({
            where: {
                id: userId,
            }
        })
        user.refreshToken = refreshToken
        await this.userRespository.save({...user});
    }

    async signToken(
        id: string,
        email: string,
    ): Promise<{ access_token: string, refresh_token: string }> {

        const accessToken = await this.jwt.signAsync(
            {
                id: id,
                email,
            },
            {
                expiresIn: '15m',
                secret: this.config.get('JWT_SECRET'),
            },
        );

        const refreshToken = await this.jwt.signAsync(
            {
                id: id,
                email,
            },
            {
                expiresIn: '15d',
                secret: this.config.get('JWT_REFRESH_SECRET'),
            },
        );
        return {
            access_token: accessToken,
            refresh_token: refreshToken
        };
    }
    
    async Refresh(userId: string): Promise<{ access_token: string, refresh_token: string }> {
        const userLogin = await this.userRespository.findOne({
            where: {
                id: userId
            }
        });
        if (!userLogin)
            throw new ForbiddenException(
                'This user does not exist',
            );
        const accessToken = await this.jwt.signAsync(
            {
                id: userLogin.id,
                email: userLogin.email,
            },
            {
                expiresIn: '15m',
                secret: this.config.get('JWT_SECRET'),
            },
        );
        return { access_token: accessToken, refresh_token: userLogin.refreshToken };
    }
}
