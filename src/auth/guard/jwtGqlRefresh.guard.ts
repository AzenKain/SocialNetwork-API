import {
    ExecutionContext,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';


export class JwtGuardGqlRefresh extends AuthGuard('jwt-refresh') {
    constructor(
        private readonly jwtService: JwtService,
        private config: ConfigService,
    ) {
        super();
    }
    getRequest(context: ExecutionContext) {
        const ctx = GqlExecutionContext.create(context);
        return ctx.getContext().req;
    }
}
