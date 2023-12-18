import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Socket } from 'socket.io';
import { WsException } from '@nestjs/websockets';
import { PostEntity } from './post.entity';
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
        return await this.postRespository.findOne({
            where: {
                id: postId
            }
        });
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

    async commentPostById(comment: CommentPostDto) {
        const newPost = await this.getPostById(comment.postId)
        const newComment: MessageType = new MessageType();
        newComment.id = uuidv5(comment.userId + comment.postId + newPost.comment.length, uuidv5.URL);
        newComment.content = comment.content;
        newComment.fileUrl = comment.fileUrl;
        newComment.userId = comment.userId;
        newComment.isDisplay = true;
        newPost.comment.push(newComment);
        return await this.postRespository.save(newPost);
    }

    async sharePostById(share: SharePostDto) {
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
        newInteraction.id = uuidv5(interaction.userId + interaction.postId + newPost.comment.length, uuidv5.URL);
        newInteraction.content = interaction.content;
        newInteraction.userId = interaction.userId;
        newInteraction.isDisplay = true;
        newPost.interaction.push(newInteraction);
        return await this.postRespository.save(newPost);
    }

    async removePostById(payload: ValidatePostDto) {
        const validatePost = await this.getPostById(payload.postId);
        validatePost.isDisplay = false;
        return await this.postRespository.save(validatePost);
    }

    async removeCommentById(payload: ValidatePostDto) {
        const validatePost = await this.getPostById(payload.postId);
        let count: number = 0;
        for (let i : number = 0; i < validatePost.comment.length; i++) {
            if (validatePost.comment[i].id === payload.Id) {
                count = i;
                break;
            }
        }
        validatePost.comment[count].isDisplay = false;
        return await this.postRespository.save(validatePost);
    }

    async removeInteractById(payload: ValidatePostDto) {
        const validatePost = await this.getPostById(payload.postId);
        let count: number = 0;
        for (let i : number = 0; i < validatePost.interaction.length; i++) {
            if (validatePost.interaction[i].id === payload.Id) {
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
                throw new WsException('Invalid credentials.');
            }
            return payload;
        } catch {
            throw new WsException('Invalid credentials.');
        }
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
