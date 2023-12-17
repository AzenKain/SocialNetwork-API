import { Args, Query, Resolver } from "@nestjs/graphql";
import { UserType } from "./user.type";
import { UserService } from './user.service';

import { UseGuards } from "@nestjs/common";
import { JwtGuardGql } from "src/auth/guard";

@UseGuards(JwtGuardGql)
@Resolver(() => UserType)
export class UserResolver {
    constructor(
        private userService: UserService
    ) {}

    @Query(()=>UserType)
    getUser(
        @Args('id') userId: string
    ) {
        return this.userService.getUser(userId);
    }

}
