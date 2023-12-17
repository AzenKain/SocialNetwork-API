import { UseGuards } from '@nestjs/common';
import { JwtGuardGql } from 'src/auth/guard';
import { PostType } from './post.type';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { PostService } from './post.service';
import { PostGateway } from './post.gateway';
import { CreatePostDto } from './dto';

@UseGuards(JwtGuardGql)
@Resolver(() => PostType)
export class PostResolver {

    constructor(
        private postService: PostService,
        private postGateway: PostGateway
    ) { }

    @Query(() => [PostType])
    getAllPostByUserId(
        @Args('id') userId: string
    ) {
        return this.postService.getAllPostByUserId(userId);
    }

    @Query(() => PostType)
    getPostById(
        @Args('id') id: string
    ) {
        return this.postService.getPostById(id);
    }

    @Mutation(() => PostType)
    async createPost(
        @Args('createPost') post: CreatePostDto
    ) {
        const newPost = await this.postService.createPost(post)
        await this.postGateway.notification(newPost.id, "New Post created!")
        return newPost;
    }

    // @Query(() => PostType)
    // async CommentPost(
    //     @Args('commentPost') commentPost: AddMemberRoomDto
    // ) {
    //     const newRoom = await this.postService.addUserToRoomchat(addMemberRoom)
    //     await this.postGateway.addMembersRoomchat(newRoom.id, newRoom.member);
    //     await this.postGateway.notification(newRoom.id, "New Member Add!")
    //     return newRoom;
    // }
}
