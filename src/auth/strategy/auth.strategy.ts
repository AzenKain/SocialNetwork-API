
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable } from '@nestjs/common';
import { User } from 'src/user/type/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        config: ConfigService,
        @InjectRepository(User) private userRespository: Repository<User>,
        ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: config.get('JWT_SECRET'),
        });
    }
    async validate(payload: {
        id: string,
        email: string, 
    }) {
        return payload;
    }
}