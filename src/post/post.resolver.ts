import { HttpCode, UseGuards } from '@nestjs/common';
import { JwtGuardGql } from 'src/auth/guard';
import { PostType } from './type/post.type';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { PostService } from './post.service';
import { PostGateway } from './post.gateway';
import { CommentPostDto, CreatePostDto, SharePostDto, InteractPostDto, ValidatePostDto} from './dto';
import { MessageType } from 'src/message/message.type';
import { NullType } from './type/null.type';
import { InteractionType } from 'src/interaction/interaction.type';

@UseGuards(JwtGuardGql)
@Resolver(() => PostType)
export class PostResolver {

    constructor(
        private postService: PostService,
        private postGateway: PostGateway
    ) { }
    
    @HttpCode(200)
    @Query(() => [PostType])
    getAllPost(
        @Args('userId') userId: string
    ) {
        return this.postService.getAllPosts(userId);
    }

    @HttpCode(200)
    @Query(() => [PostType])
    getAllPostByUserId(
        @Args('userId') userId: string
    ) {
        return this.postService.getAllPostByUserId(userId);
    }

    @HttpCode(200)
    @Query(() => [PostType])
    getDailyPostByUserId(
        @Args('userId') userId: string
    ) {
        return this.postService.getPostDaily(userId);
    }

    @HttpCode(200)
    @Query(() => [PostType])
    searchPost(
        @Args('content') content: string
    ) {
        return this.postService.searchPostByContent(content);
    }
    
    @HttpCode(200)
    @Query(() => PostType)
    getPostById(
        @Args('id') id: string
    ) {
        return this.postService.getPostById(id);
    }

    @HttpCode(201)
    @Mutation(() => PostType)
    async createPost(
        @Args('createPost') post: CreatePostDto
    ) {
        const newPost = await this.postService.createPost(post)
        await this.postGateway.addMemberRoomchat(newPost.id, newPost.ownerUserId)
        await this.postGateway.notification(newPost.id, "newPostCreated", newPost)
        return newPost;
    }

    @HttpCode(201)
    @Mutation(() => PostType)
    async sharePost(
        @Args('sharePost') sharePost: SharePostDto
    ) {
        const newPost  = await this.postService.sharePostById(sharePost)
        const linkedPost = await this.postService.getPostById(sharePost.postId)
        await this.postGateway.notification(sharePost.userId, "newPostCreated", newPost)
        await this.postGateway.notification(linkedPost.ownerUserId, "sharePost", newPost)
        return newPost;
    }
    
    @HttpCode(201)
    @Mutation(() => PostType)
    async validatePost(
        @Args('validatePost') validatePost: ValidatePostDto
    ) {
        const newPost  = await this.postService.validatePostById(validatePost)
        await this.postGateway.notification(validatePost.postId, "validatePost", validatePost)
        return newPost;
    }

    @HttpCode(204)
    @Mutation(() => NullType)
    async removePost(
        @Args('removePost') RemovePost: ValidatePostDto
    ) {
        await this.postService.removePostById(RemovePost)
        await this.postGateway.notification(RemovePost.postId, "removePost", RemovePost)
        return {data : null}
    }

    @HttpCode(201)
    @Mutation(() => MessageType)
    async addComment(
        @Args('addComment') commentPost: CommentPostDto
    ) {
        const newComment  = await this.postService.commentPostById(commentPost)
        await this.postGateway.addMemberRoomchat(commentPost.postId, commentPost.userId)
        await this.postGateway.notification(commentPost.postId, "addComment", newComment)
        return newComment;
    }

    @HttpCode(201)
    @Mutation(() => MessageType)
    async validateComment(
        @Args('validateComment') commentPost: CommentPostDto
    ) {
        const newComment  = await this.postService.validateCommentById(commentPost)
        await this.postGateway.notification(commentPost.postId, "validateComment", newComment)
        return newComment;
    }

    @HttpCode(204)
    @Mutation(() => NullType)
    async removeComment(
        @Args('removeComment') removeComment: CommentPostDto
    ) {
        await this.postService.removeCommentById(removeComment)
        await this.postGateway.notification(removeComment.postId, "removeComment", removeComment)
        return {data : null}
    }

    @HttpCode(201)
    @Mutation(() => InteractionType)
    async interactPost(
        @Args('addInteractPost') interactPost: InteractPostDto
    ) {
        const newInteraction  = await this.postService.interactPostById(interactPost)
        const dataRe : any = {...newInteraction};
        dataRe.postId = interactPost.postId;
        await this.postGateway.addMemberRoomchat(interactPost.postId, interactPost.userId)
        await this.postGateway.notification(interactPost.postId, "addInteractionPost!", dataRe)
        return newInteraction;
    }

    @HttpCode(204)
    @Mutation(() => NullType)
    async RemoveInteractionPost(
        @Args('removeInteractionPost') interactPost: InteractPostDto
    ) {
        await this.postService.removeInteractById(interactPost)
        await this.postGateway.notification(interactPost.postId, "removeInteractionPost", interactPost)
        return {data : null}
    }

    @HttpCode(201)
    @Mutation(() => MessageType)
    async InteractComment(
        @Args('addInteractComment') interactComment: InteractPostDto
    ) {
        const newComment  = await this.postService.addInteractMessage(interactComment)
        await this.postGateway.notification(interactComment.postId, "addInteractionComment", newComment)
        return newComment;
    }

    @HttpCode(204)
    @Mutation(() => NullType)
    async RemoveInteractionComment(
        @Args('removeInteractionComment') interactComment: InteractPostDto
    ) {
        await this.postService.removeInteractMessage(interactComment)
        await this.postGateway.notification(interactComment.postId, "removeInteractionComment", interactComment)
        return {data : null}
    }
}
