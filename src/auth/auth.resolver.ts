import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { AuthDto, SignUpDto } from './dto';
import { AuthResponseType, LogoutResponseType } from './type';
import { UseGuards } from '@nestjs/common';
import { JwtGuardGql, JwtGuardGqlRefresh } from './guard';
import { AuthGuard } from '@nestjs/passport';

@Resolver()
export class AuthResolver {
    constructor(
        private authService: AuthService
    ) {}
    @Query(() => AuthResponseType)
    Login(
        @Args('userDto') userDto: AuthDto,
    ) {
        return this.authService.Login(userDto);
    }
    
    @UseGuards(JwtGuardGql)
    @Query(() => LogoutResponseType )
    logout (
        @Args('id') userId: string,
    ){
        return this.authService.Logout(userId);
        
    }

    @Mutation(() => AuthResponseType)
    SignUp(
        @Args('userDto') userDto: SignUpDto,
    ) {
        return this.authService.Signup(userDto);
    }
    @UseGuards(JwtGuardGqlRefresh)
    @Query(() => AuthResponseType)
    Refresh(
        @Args('id') userId: string,
    ) {
        return this.authService.Refresh(userId);
    }
}
