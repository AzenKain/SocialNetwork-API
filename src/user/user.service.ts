import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity'
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';


@Injectable()
export class UserService {
    constructor(
        private jwt: JwtService,
        private config: ConfigService,
        @InjectRepository(User) private userRespository: Repository<User>,
    ) {}
    
    async getUser(userId: string): Promise<User> {
        const user = await this.userRespository.findOne({
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

}
