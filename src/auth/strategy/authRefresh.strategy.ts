
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
    constructor(
        config: ConfigService,
        private authService: AuthService,
        ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: config.get('JWT_REFRESH_SECRET'),
            passReqToCallback: true,
        });
    }
    async validate(req: Request, payload: {
        id: string,
        email: string, 
    }) {
        const refreshToken = req.get('Authorization').replace('Bearer', '').trim();
        return { ...payload, refreshToken };
    }
}