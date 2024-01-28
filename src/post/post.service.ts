import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Socket } from 'socket.io';
import { PostEntity } from './type/post.entity';
import { CommentPostDto, CreatePostDto, InteractPostDto, SharePostDto, ValidatePostDto } from './dto';
import { v5 as uuidv5 } from 'uuid';
import { MessageType } from 'src/message/message.type';
import { InteractionType } from 'src/interaction/interaction.type';
import { User } from 'src/user/type/user.entity';
import * as otpGenerator from 'otp-generator';

@Injectable()
export class PostService {
    constructor(
        private readonly jwtService: JwtService,
        private config: ConfigService,
        @InjectRepository(PostEntity) private postRespository: Repository<PostEntity>,
        @InjectRepository(User) private userRespository: Repository<User>,
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

    async searchPostByContent(content: string) {
        const postSelect =  await this.postRespository.find({});
        const dataRe = [];
        for (const userIndex in postSelect) {
            if (!('content' in postSelect[userIndex])) continue;
            if (postSelect[userIndex].content && postSelect[userIndex].content.toLowerCase().includes(content.toLowerCase())) {
                dataRe.push(postSelect[userIndex])
            }
        }
        return dataRe
    }

    async getPostDaily(userId: string) {
        const userData = await this.userRespository.findOne({
            where: {
                id: userId
            }
        })
        if (!userData) {
            throw new ForbiddenException(
                `This userId (${userId}) does not exist`,
            );
        }
        const postRe = await this.postRespository.find({
            where: {
                ownerUserId: userId,
                isDisplay: true
            }
        });
        let dataRe = [...postRe]
        for (let i : number = 0; i < userData.friends.length; i++) {
            const dataPostFriend = await this.postRespository.find({
                where: {
                    ownerUserId: userData.friends[i],
                    isDisplay: true
                }
            })
            dataRe = dataRe.concat(dataPostFriend)
        }
        return dataRe;
    }

    async createPost(post: CreatePostDto) {
        let generatedOTP: string = otpGenerator.generate(10, {digits: false, upperCaseAlphabets: false, specialChars: false });
        let postId: string = uuidv5(post.userId + generatedOTP, uuidv5.URL);

        while (true) {
            const postSelect =  await this.postRespository.findOne({
                where: {
                    id: postId
                }
            });
            if (postSelect) {
                generatedOTP = otpGenerator.generate(10, {digits: false, upperCaseAlphabets: false, specialChars: false });
                postId = uuidv5(post.userId + generatedOTP, uuidv5.URL);
            }
            else {
                break;
            }
        }
     
        const postNew = this.postRespository.create({
            id: postId,
            ownerUserId: post.userId,
            fileUrl: post.fileUrl,
            content: post.content,
            type: post.type,
            interaction: [],
            comment: [],
            isDisplay: true
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
        let generatedOTP: string = otpGenerator.generate(10, {digits: false, upperCaseAlphabets: false, specialChars: false });
        let postId: string = uuidv5(share.userId + generatedOTP, uuidv5.URL);

        while (true) {
            const postSelect =  await this.postRespository.findOne({
                where: {
                    id: postId
                }
            });
            if (postSelect) {
                generatedOTP = otpGenerator.generate(10, {digits: false, upperCaseAlphabets: false, specialChars: false });
                postId = uuidv5(share.userId + generatedOTP, uuidv5.URL);
            }
            else {
                break;
            }
        }
        const postNew = this.postRespository.create({
            id: postId,
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
        let generatedOTP: string = otpGenerator.generate(10, {digits: false, upperCaseAlphabets: false, specialChars: false });
        let interactionId: string = uuidv5(interaction.userId + generatedOTP, uuidv5.URL);
        while (true) {
            if (newPost.interaction.findIndex(inter => inter.id === interactionId) !== -1) {
                generatedOTP = otpGenerator.generate(10, {digits: false, upperCaseAlphabets: false, specialChars: false });
                interactionId = uuidv5(interaction.userId + generatedOTP, uuidv5.URL);
            }
            else {
                break;
            }
        }
        newInteraction.id = interactionId;
        newInteraction.content = interaction.content;
        newInteraction.userId = interaction.userId;
        newInteraction.isDisplay = true;
        newInteraction.updated_at = new Date();
        newInteraction.created_at = new Date();
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
        let generatedOTP: string = otpGenerator.generate(10, {digits: false, upperCaseAlphabets: false, specialChars: false });
        let commentId: string = uuidv5(comment.userId + generatedOTP, uuidv5.URL);
        while (true) {
            if (newPost.comment.findIndex(comment => comment.id === commentId) !== -1) {
                generatedOTP = otpGenerator.generate(10, {digits: false, upperCaseAlphabets: false, specialChars: false });
                commentId = uuidv5(comment.userId + generatedOTP, uuidv5.URL);
            }
            else {
                break;
            }
        }
        newComment.id = commentId;
        newComment.content = comment.content;
        newComment.fileUrl = comment.fileUrl;
        newComment.userId = comment.userId;
        newComment.roomId = comment.postId;
        newComment.isDisplay = true;
        newComment.interaction = [];
        newComment.created_at = new Date();
        newComment.updated_at = new Date();
        newPost.comment.push(newComment);
        await this.postRespository.save(newPost);
        return newComment;
    }

    async validateCommentById(payload: CommentPostDto){
        const validatePost = await this.getPostById(payload.postId);
        const countComment = validatePost.comment.findIndex(comment => comment.id === payload.commentId);
        if (countComment == -1) {
            throw new ForbiddenException(`Comment with id ${payload.commentId} not found.`);
        }
        validatePost.comment[countComment].content = payload.content
        validatePost.comment[countComment].fileUrl = payload.fileUrl
        return await this.postRespository.save(validatePost);
    }

    async removeCommentById(payload: CommentPostDto) {
        const validatePost = await this.getPostById(payload.postId);
        const countComment = validatePost.comment.findIndex(comment => comment.id === payload.commentId);
        if (countComment == -1) {
            throw new ForbiddenException(`Comment with id ${payload.commentId} not found.`);
        }
        validatePost.comment[countComment].isDisplay = false;
        return await this.postRespository.save(validatePost);
    }

    async removeInteractById(payload: InteractPostDto) {
        const validatePost = await this.getPostById(payload.postId);
        
        const countIndex = validatePost.interaction.findIndex(item => item.id === payload.interactionId);
        if (countIndex == -1) {
            throw new ForbiddenException(`Comment with id ${payload.interactionId} not found.`);
        }
        validatePost.interaction[countIndex].isDisplay = false;
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
        const countComment = newPost.comment.findIndex(comment => comment.id === payload.commentId);
        if (countComment == -1) {
            throw new ForbiddenException(`Comment with id ${payload.commentId} not found.`);
        }
        const newInteraction = new InteractionType();
        let generatedOTP: string = otpGenerator.generate(10, {digits: false, upperCaseAlphabets: false, specialChars: false });
        let interactionId: string = uuidv5(payload.userId + generatedOTP, uuidv5.URL);
        while (true) {
            if (newPost.comment[countComment].interaction.findIndex(inter => inter.id === interactionId) !== -1) {
                generatedOTP = otpGenerator.generate(10, {digits: false, upperCaseAlphabets: false, specialChars: false });
                interactionId = uuidv5(payload.userId + generatedOTP, uuidv5.URL);
            }
            else {
                break;
            }
        }
        newInteraction.id = uuidv5(payload.userId + payload.postId + newPost.interaction.length + generatedOTP, uuidv5.URL);
        newInteraction.content = payload.content;
        newInteraction.userId = payload.userId;
        newInteraction.isDisplay = true;
        newInteraction.updated_at = new Date();
        newInteraction.created_at = new Date();
        newPost.comment[countComment].interaction.push(newInteraction);
        await this.postRespository.save(newPost);
        return newPost.comment[countComment];
    }
    
    async removeInteractMessage(payload: InteractPostDto) {
        const validatePost = await this.getPostById(payload.postId);
        const commentIndex = validatePost.comment.findIndex(comment => comment.id === payload.commentId);
    
        if (commentIndex !== -1) {
            const interactionIndex = validatePost.comment[commentIndex].interaction.findIndex(interaction => interaction.id === payload.interactionId);
    
            if (interactionIndex !== -1) {
                validatePost.comment[commentIndex].interaction[interactionIndex].isDisplay = false;
                await this.postRespository.save(validatePost);
            } else {
                throw new ForbiddenException(`Interaction with id ${payload.interactionId} not found.`);
            }
        } else {
            throw new ForbiddenException(`Comment with id ${payload.commentId} not found.`);
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
