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
import { DataNotificationType, NotificationType } from 'src/user/type/notification.type';


@Injectable()
export class PostService {
    constructor(
        private readonly jwtService: JwtService,
        private config: ConfigService,
        @InjectRepository(PostEntity) private postRepository: Repository<PostEntity>,
        @InjectRepository(User) private userRepository: Repository<User>,
    ) { }

    async getUser(userId: string): Promise<User> {
        const user = await this.userRepository.findOne({
            where: {
                id: userId
            }
        });

        if (!user)
            throw new ForbiddenException(
                `This userId (${userId}) does not exist`,
            );
        if (user.role === "BANNED") {
            throw new ForbiddenException(
                `This userId had banned`,
            );
        }
        delete user.hash;
        delete user.refreshToken;
        return user;
    }
    async getAllPosts(userId: string) {
        const user = await this.getUser(userId);
        if (user.role !== "ADMIN") {
            throw new ForbiddenException(
                'Request is denied',
            );
        }
        return await this.postRepository.find({});
    }
    async getPostById(postId: string) {
        const postSelect =  await this.postRepository.findOne({
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
        const postSelect =  await this.postRepository.find({});
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
        const userData = await this.userRepository.findOne({
            where: {
                id: userId
            }
        })
        if (!userData) {
            throw new ForbiddenException(
                `This userId (${userId}) does not exist`,
            );
        }
        if (userData.role === "BANNED") {
            throw new ForbiddenException(
                `This user had banned`,
            );
        }
        const postRe = await this.postRepository.find({
            where: {
                ownerUserId: userId,
                isDisplay: true
            }
        });
        let dataRe = [];
        dataRe = dataRe.concat(postRe)

        if (userData.friends && userData.friends.length > 0 ) {
            for (let i : number = 0; i < userData.friends.length; i++) {
                const dataPostFriend = await this.postRepository.find({
                    where: {
                        ownerUserId: userData.friends[i],
                        isDisplay: true
                    }
                })
                if (!dataPostFriend) continue;
                dataRe = dataRe.concat(dataPostFriend)
            }
        }

        const dataAdmin = await this.userRepository.findOne({
            where: {
                email: this.config.get('MAIL_USER')
            }
        })

        if (dataAdmin && dataAdmin.id !== userId) {
            delete dataAdmin.hash
            delete dataAdmin.refreshToken
            const dataPostAdmin = await this.postRepository.find({
                where: {
                    ownerUserId: dataAdmin.id,
                    isDisplay: true
                }
            })
            if (dataPostAdmin) {
                dataRe = dataRe.concat(dataPostAdmin)
            }
        }
        return dataRe;
    }

    async createPost(post: CreatePostDto) {
        const dataUser = await this.userRepository.findOne({
            where: {
                id: post.userId
            }
        })
        if (!dataUser) {
            throw new ForbiddenException(
                `This userId (${post.userId}) does not exist`,
            );
        }
        if (dataUser.role === "BANNED") {
            throw new ForbiddenException(
                `This user had banned`,
            );
        }
        let generatedOTP: string = otpGenerator.generate(10, {digits: false, upperCaseAlphabets: false, specialChars: false });
        let postId: string = uuidv5(post.userId + generatedOTP, uuidv5.URL);

        while (true) {
            const postSelect =  await this.postRepository.findOne({
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
     
        const postNew = this.postRepository.create({
            id: postId,
            ownerUserId: post.userId,
            fileUrl: post.fileUrl,
            content: post.content,
            type: post.type,
            interaction: [],
            comment: [],
            isDisplay: true
        })
        if (post.type === "POST") {
            for (let i = 0; i < dataUser.friends.length; i++) {
                const tmpDataFriend = await this.userRepository.findOne({
                    where: {
                        id: dataUser.friends[i]
                    }
                })
                if (!tmpDataFriend) continue;
                const notiUser = new NotificationType();
                notiUser.id = uuidv5(postNew.id + dataUser.friends[i] + tmpDataFriend.notification.length + generatedOTP, uuidv5.URL);
                const notiContent = new DataNotificationType();
                notiContent.roomId = postNew.id;
                notiContent.userDtoId = dataUser.id;
                notiUser.content = notiContent;
                notiUser.isDisplay = true;
                notiUser.isRead = false;
                notiUser.type = "NEWPOST";
                notiUser.created_at = new Date();
                notiUser.updated_at = new Date();
                tmpDataFriend.notification.push(notiUser);
                await this.userRepository.save(tmpDataFriend);
            };
        }
        return await this.postRepository.save(postNew);
    }

    async validatePostById(payload: ValidatePostDto){
        const newPost = await this.getPostById(payload.postId)
        newPost.fileUrl = payload.fileUrl
        newPost.content = payload.content
        return await this.postRepository.save(newPost);
    }

    async sharePostById(share: SharePostDto) {
        await this.getPostById(share.postId)
        let generatedOTP: string = otpGenerator.generate(10, {digits: false, upperCaseAlphabets: false, specialChars: false });
        let postId: string = uuidv5(share.userId + generatedOTP, uuidv5.URL);

        while (true) {
            const postSelect =  await this.postRepository.findOne({
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
        const postNew = this.postRepository.create({
            id: postId,
            ownerUserId: share.userId,
            fileUrl: share.fileUrl,
            content: share.content,
            linkedShare: share.postId
        })
        return await this.postRepository.save(postNew);
    }

    async interactPostById(interaction: InteractPostDto) {
        const dataUser = await this.userRepository.findOne({
            where: {
                id: interaction.userId
            }
        })
        if (!dataUser) {
            throw new ForbiddenException(
                `This userId (${interaction.userId}) does not exist`,
            );
        }
        if (dataUser.role === "BANNED") {
            throw new ForbiddenException(
                `This user had banned`,
            );
        }
        const newPost = await this.getPostById(interaction.postId);
        if (newPost.interaction.findIndex(inter => inter.userId === interaction.userId && inter.isDisplay == true) !== -1) {
            throw new ForbiddenException(`Duplicate interaction`);
        }
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
        await this.postRepository.save(newPost);
        
        if (newPost.interaction.findIndex(inter => inter.userId === interaction.userId) === -1) {
            const ownerPost = await this.userRepository.findOne({
                where: {
                    id: newPost.ownerUserId,
                }
            })
            if (!ownerPost) {
                throw new ForbiddenException(
                    `The owner post does not exist`,
                );
            }
            const notiUser = new NotificationType();
            notiUser.id = uuidv5(newPost.id + ownerPost.id + ownerPost.notification.length + generatedOTP, uuidv5.URL);
            const notiContent = new DataNotificationType();
            notiContent.roomId = newPost.id;
            notiContent.userDtoId = dataUser.id;
            notiUser.content = notiContent;
            notiUser.isDisplay = true;
            notiUser.isRead = false;
            notiUser.type = "NEWINTERACTION";
            notiUser.created_at = new Date();
            notiUser.updated_at = new Date();
            ownerPost.notification.push(notiUser);
            await this.userRepository.save(ownerPost);
        }

        return newInteraction
    }

    async removePostById(payload: ValidatePostDto) {
        const validatePost = await this.getPostById(payload.postId);
        if (validatePost.ownerUserId !== payload.userId) {
            throw new ForbiddenException(
                'The user has no permission',
            );
        }
        validatePost.isDisplay = false;
        return await this.postRepository.save(validatePost);
    }
    
    async commentPostById(comment: CommentPostDto) {
        const dataUser = await this.userRepository.findOne({
            where: {
                id: comment.userId
            }
        })
        if (!dataUser) {
            throw new ForbiddenException(
                `This userId (${comment.userId}) does not exist`,
            );
        }
        if (dataUser.role === "BANNED") {
            throw new ForbiddenException(
                `This user had banned`,
            );
        }
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
        await this.postRepository.save(newPost);


        const ownerPost = await this.userRepository.findOne({
            where: {
                id: newPost.ownerUserId,
            }
        })
        if (!ownerPost) {
            throw new ForbiddenException(
                `The owner post does not exist`,
            );
        }
        const notiUser = new NotificationType();
        notiUser.id = uuidv5(newPost.id + ownerPost.id + ownerPost.notification.length + generatedOTP, uuidv5.URL);
        const notiContent = new DataNotificationType();
        notiContent.roomId = newPost.id;
        notiContent.userDtoId = dataUser.id;
        notiUser.content = notiContent;
        notiUser.isDisplay = true;
        notiUser.isRead = false;
        notiUser.type = "NEWCOMMENT";
        notiUser.created_at = new Date();
        notiUser.updated_at = new Date();
        ownerPost.notification.push(notiUser);
        await this.userRepository.save(ownerPost);

        return newComment;
    }

    async validateCommentById(payload: CommentPostDto){
        const validatePost = await this.getPostById(payload.postId);
        const countComment = validatePost.comment.findIndex(comment => comment.id === payload.commentId);
        if (countComment == -1) {
            throw new ForbiddenException(`Comment with id ${payload.commentId} not found.`);
        }
        if (validatePost.comment[countComment].userId !== payload.userId) {
            throw new ForbiddenException(
                'The user has no permission',
            );
        }
        validatePost.comment[countComment].content = payload.content
        validatePost.comment[countComment].fileUrl = payload.fileUrl
        return await this.postRepository.save(validatePost);
    }

    async removeCommentById(payload: CommentPostDto) {
        const validatePost = await this.getPostById(payload.postId);
        const countComment = validatePost.comment.findIndex(comment => comment.id === payload.commentId);
        if (countComment == -1) {
            throw new ForbiddenException(`Comment with id ${payload.commentId} not found.`);
        }
        if (validatePost.comment[countComment].userId !== payload.userId) {
            throw new ForbiddenException(
                'The user has no permission',
            );
        }
        validatePost.comment[countComment].isDisplay = false;
        return await this.postRepository.save(validatePost);
    }

    async removeInteractById(payload: InteractPostDto) {
        const validatePost = await this.getPostById(payload.postId);
        
        const countIndex = validatePost.interaction.findIndex(item => item.id === payload.interactionId);
        if (countIndex == -1) {
            throw new ForbiddenException(`Comment with id ${payload.interactionId} not found.`);
        }
        if (validatePost.interaction[countIndex].userId !== payload.userId) {
            throw new ForbiddenException(
                'The user has no permission',
            );
        }
        validatePost.interaction[countIndex].isDisplay = false;
        return await this.postRepository.save(validatePost);
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
        if (newPost.comment[countComment].interaction.findIndex(inter => inter.userId === payload.userId && inter.isDisplay == true) !== -1) {
            throw new ForbiddenException(`Duplicate interaction`);
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
        await this.postRepository.save(newPost);
        return newPost.comment[countComment];
    }
    
    async removeInteractMessage(payload: InteractPostDto) {
        const validatePost = await this.getPostById(payload.postId);
        const commentIndex = validatePost.comment.findIndex(comment => comment.id === payload.commentId);
    
        if (commentIndex !== -1) {
            const interactionIndex = validatePost.comment[commentIndex].interaction.findIndex(interaction => interaction.id === payload.interactionId);
    
            if (interactionIndex !== -1) {
                if (validatePost.comment[commentIndex].interaction[interactionIndex].userId !== payload.userId) {
                    throw new ForbiddenException(
                        'The user has no permission',
                    );
                }
                validatePost.comment[commentIndex].interaction[interactionIndex].isDisplay = false;
                await this.postRepository.save(validatePost);
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
        return await this.postRepository.find({
            where: {
                ownerUserId: userId
            }
        });
    }

    async getAllPostByUserIdComment(userId: string) {
        let dataRe = [];
        const dataPost = await this.postRepository.find({});
        const dataAdmin = await this.userRepository.findOne({
            where: {
                email: this.config.get('MAIL_USER')
            }
        })
        delete dataAdmin.hash
        delete dataAdmin.refreshToken
        if (dataAdmin) {
            const dataPostAdmin = await this.postRepository.find({
                where: {
                    ownerUserId: dataAdmin.id,
                    isDisplay: true
                }
            })
            dataRe = dataRe.concat(dataPostAdmin)
        }
        for (const post of dataPost) {
            const indexComment = post.comment.findIndex(comment => comment.userId === userId)
            if ( indexComment !==  -1) {
                dataRe.push(post)
            }
        }
        return dataRe
    }
}
