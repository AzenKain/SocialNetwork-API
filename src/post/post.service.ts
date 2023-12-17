import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Socket } from 'socket.io';
import { WsException } from '@nestjs/websockets';
import { PostEntity } from './post.entity';
import { CreatePostDto } from './dto';
import { v5 as uuidv5 } from 'uuid';

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
