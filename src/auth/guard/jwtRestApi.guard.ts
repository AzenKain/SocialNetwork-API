import {
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AuthGuard } from "@nestjs/passport";


@Injectable()
export class JwtGuardRestApi extends AuthGuard('jwt') {
    constructor(
        private readonly jwtService: JwtService,
        private config: ConfigService,
    ) {
        super();
    }
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);
        if (!token) {
            throw new UnauthorizedException();
        }
        try {
            const payload = await this.jwtService.verifyAsync(
                token,
                {
                    secret: this.config.get('JWT_SECRET')
                }
            );

            request['user'] = payload;
        } catch {
            throw new UnauthorizedException();
        }
        return true;
    }
    
    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}