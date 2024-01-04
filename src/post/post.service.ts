import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Socket } from 'socket.io';
import { WsException } from '@nestjs/websockets';
import { PostEntity } from './type/post.entity';
import { CommentPostDto, CreatePostDto, InteractPostDto, SharePostDto, ValidatePostDto } from './dto';
import { v5 as uuidv5 } from 'uuid';
import { MessageType } from 'src/message/message.type';
import { InteractionType } from 'src/interaction/interaction.type';

@Injectable()
export class PostService {
    constructor(
        private readonly jwtService: JwtService,
        private config: ConfigService,
        @InjectRepository(PostEntity) private postRespository: Repository<PostEntity>,
    ) { }

    async getPostById(postId: string) {
        const postSelect =  await this.postRespository.findOne({
            where: {
                id: postId
            }
        });
        if (!postSelect) {
            throw new ForbiddenException(
                'This post does not exist',
            );
        }
        return postSelect
    }

    async createPost(post: CreatePostDto) {
        const postNew = this.postRespository.create({
            id: uuidv5(post.userId, uuidv5.URL),
            ownerUserId: post.userId,
            fileUrl: post.fileUrl,
            content: post.content
        })
        return await this.postRespository.save(postNew);
    }

    async validatePostById(payload: ValidatePostDto){
        const newPost = await this.getPostById(payload.postId)
        newPost.fileUrl = payload.fileUrl
        newPost.content = payload.content
        return await this.postRespository.save(newPost);
    }

    async sharePostById(share: SharePostDto) {
        await this.getPostById(share.postId)

        const postNew = this.postRespository.create({
            id: uuidv5(share.userId, uuidv5.URL),
            ownerUserId: share.userId,
            fileUrl: share.fileUrl,
            content: share.content,
            linkedShare: share.postId
        })
        return await this.postRespository.save(postNew);
    }

    async interactPostById(interaction: InteractPostDto) {
        const newPost = await this.getPostById(interaction.postId);
        const newInteraction = new InteractionType();
        newInteraction.id = uuidv5(interaction.userId + interaction.postId + newPost.interaction.length, uuidv5.URL);
        newInteraction.content = interaction.content;
        newInteraction.userId = interaction.userId;
        newInteraction.isDisplay = true;
        newPost.interaction.push(newInteraction);
        await this.postRespository.save(newPost);
        return newInteraction
    }

    async removePostById(payload: ValidatePostDto) {
        const validatePost = await this.getPostById(payload.postId);
        validatePost.isDisplay = false;
        return await this.postRespository.save(validatePost);
    }
    async commentPostById(comment: CommentPostDto) {
        const newPost = await this.getPostById(comment.postId)
        const newComment: MessageType = new MessageType();
        newComment.id = uuidv5(comment.userId + comment.postId + newPost.comment.length, uuidv5.URL);
        newComment.content = comment.content;
        newComment.fileUrl = comment.fileUrl;
        newComment.userId = comment.userId;
        newComment.roomId = comment.postId;
        newComment.isDisplay = true;
        newPost.comment.push(newComment);
        await this.postRespository.save(newPost);
        return newComment;
    }
    async validateCommentById(payload: CommentPostDto){
        const validatePost = await this.getPostById(payload.postId);
        let count: number = 0;
        for (let i : number = 0; i < validatePost.comment.length; i++) {
            if (validatePost.comment[i].id === payload.commentId) {
                count = i;
                break;
            }
        }
        validatePost.comment[count].content = payload.content
        validatePost.comment[count].fileUrl = payload.fileUrl
        return await this.postRespository.save(validatePost);
    }

    async removeCommentById(payload: CommentPostDto) {
        const validatePost = await this.getPostById(payload.postId);
        let count: number = 0;
        for (let i : number = 0; i < validatePost.comment.length; i++) {
            if (validatePost.comment[i].id === payload.commentId) {
                count = i;
                break;
            }
        }
        validatePost.comment[count].isDisplay = false;
        return await this.postRespository.save(validatePost);
    }

    async removeInteractById(payload: InteractPostDto) {
        const validatePost = await this.getPostById(payload.postId);
        let count: number = 0;
        for (let i : number = 0; i < validatePost.interaction.length; i++) {
            if (validatePost.interaction[i].id === payload.interactionId) {
                count = i;
                break;
            }
        }
        validatePost.interaction[count].isDisplay = false;
        return await this.postRespository.save(validatePost);
    }

    async getPayloadFromSocket(socket: Socket) {
        let auth_token = socket.handshake.headers.authorization;
        auth_token = auth_token.split(' ')[1];
        try {
            const payload = await this.jwtService.verifyAsync(
                auth_token,
                {
                    secret: this.config.get('JWT_SECRET')
                }
            );
            if (!payload) {
                return null;
            }
            return payload;
        } catch {
            return null;
        }
    }


    async addInteractMessage(payload: InteractPostDto) {
        const newPost = await this.getPostById(payload.postId);
        const newInteraction = new InteractionType();
        newInteraction.id = uuidv5(payload.userId + payload + newPost.comment.length, uuidv5.URL);
        newInteraction.content = payload.content;
        newInteraction.userId = payload.userId;
        newInteraction.isDisplay = true;
        let countComment: number = 0;
        for (let i : number = 0; i < newPost.comment.length; i++) {
            if (newPost.comment[i].id === payload.commentId) {
                countComment = i;
                break;
            }
        }
        newPost.comment[countComment].interaction.push(newInteraction);
        await this.postRespository.save(newPost);
        return newPost.comment[countComment];
    }

    async removeInteractMessage(payload: InteractPostDto) {
        const validatePost = await this.getPostById(payload.postId);
        let countComment: number = 0;
        for (let i : number = 0; i < validatePost.comment.length; i++) {
            if (validatePost.comment[i].id === payload.commentId) {
                countComment = i;
                break;
            }
        }
        let countInteraction: number = 0;
        for (let i : number = 0; i < validatePost.comment[countComment].interaction.length; i++) {
            if (validatePost.comment[countComment].interaction[i].id === payload.interactionId) {
                countInteraction = i;
                break;
            }
        }
        validatePost.comment[countComment].interaction[countInteraction].isDisplay = false;
        await this.postRespository.save(validatePost);
    }

    async decodeHeader(socket: Socket) {
        let auth_token = socket.handshake.headers.authorization;
        auth_token = auth_token.split(' ')[1];
        return await this.jwtService.decode(
            auth_token,
        );
    }

    async getAllPostByUserId(userId: string) {
        return await this.postRespository.find({
            where: {
                ownerUserId: userId
            }
        });
    }

    async getAllPostByUserIdComment(userId: string) {
        return await this.postRespository.find({
            where: {
                comment: {
                    userId: userId
                }
            }
        });
    }
}
