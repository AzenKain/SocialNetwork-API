import { UseGuards } from '@nestjs/common';
import { JwtGuardGql } from 'src/auth/guard';
import { PostType } from './post.type';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { PostService } from './post.service';
import { PostGateway } from './post.gateway';
import { CommentPostDto, CreatePostDto, SharePostDto, InteractPostDto } from './dto';
import { ValidatePostDto } from './dto/validatePost.dto';

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
        await this.postGateway.notification(newPost.id, "New Post created!", newPost)
        return newPost;
    }

    @Query(() => PostType)
    async commentPost(
        @Args('commentPost') commentPost: CommentPostDto
    ) {
        const newPost  = await this.postService.commentPostById(commentPost)
        await this.postGateway.notification(newPost.id, "New comment!", newPost)
        return newPost;
    }

    @Query(() => PostType)
    async sharePost(
        @Args('sharePost') sharePost: SharePostDto
    ) {
        const newPost  = await this.postService.sharePostById(sharePost)
        await this.postGateway.notification(newPost.id, "Share Post!", newPost)
        return newPost;
    }

    @Query(() => PostType)
    async interactPost(
        @Args('interactPost') interactPost: InteractPostDto
    ) {
        const newPost  = await this.postService.interactPostById(interactPost)
        await this.postGateway.notification(newPost.id, "New interaction!", newPost)
        return newPost;
    }

    @Mutation(() => PostType)
    async RemovePost(
        @Args('RemovePost') RemovePost: ValidatePostDto
    ) {
        const newPost  = await this.postService.removePostById(RemovePost)
        await this.postGateway.notification(newPost.id, "Remove post!", newPost)
        return newPost;
    }

    @Mutation(() => PostType)
    async RemoveComment(
        @Args('RemoveComment') RemoveComment: ValidatePostDto
    ) {
        const newPost  = await this.postService.removeCommentById(RemoveComment)
        await this.postGateway.notification(newPost.id, "Remove comment!", newPost)
        return newPost;
    }

    @Mutation(() => PostType)
    async RemoveInteraction(
        @Args('RemoveInteraction') RemoveInteraction: ValidatePostDto
    ) {
        const newPost  = await this.postService.removeInteractById(RemoveInteraction)
        await this.postGateway.notification(newPost.id, "Remove interaction!", newPost)
        return newPost;
    }
}
