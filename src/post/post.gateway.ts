import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PostService } from './post.service';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/type/user.entity';
import { Repository } from 'typeorm';

@WebSocketGateway()
export class PostGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  connectedClients: Map<string, Socket> = new Map<string, Socket>();
  
  constructor(
    private postService: PostService,
    @InjectRepository(User) private userRespository: Repository<User>,
  ) { }


  afterInit(socket: Socket) {

  }
  async addMemberRoomchat(roomId: string, userId: string) {
    try {
      this.connectedClients[userId].join(roomId);
    }
    catch (err) {
      return;
    }
  }
  
  async addMembersRoomchat(roomId: string, userId: string[]) {
    for (const memberId in userId) {
      try {
        this.connectedClients[memberId].join(roomId);
      }
      catch (err) {
        continue;
      }
    }
    return;
  }

  async leaveMembersRoomchat(roomId: string, userId: string[]) {
    for (const memberId in userId) {
      try {
        this.connectedClients[memberId].leave(roomId);
      }
      catch (err) {
        continue;
      }
    }
    return;
  }
  
  async notification(roomId: string, title: string,data: any) {
    this.server.to(roomId).emit(title, data)
  }

  async handleConnection(socket: Socket) {
    const data = await this.postService.getPayloadFromSocket(socket);
    try {
      if (data == null) {
        socket.disconnect();
        return;
      }
      const userId = data.id;
      if (!userId) {
        socket.disconnect();
        return;
      }
      this.connectedClients.set(userId, socket);
      socket.join(userId);
      const user = await this.userRespository.findOne({
        where: {
          id: userId
        }
      })
      if (!user) return;
      user.isOnline = true;
      this.userRespository.save(user);
      if (userId) {
        const postOwner = await this.postService.getAllPostByUserId(userId);
        if (!postOwner) return;
        for (const post of postOwner) {
          socket.join(post.id)
        }
        const postComment = await this.postService.getAllPostByUserIdComment(userId);
        if (!postComment) return;
        for (const post of postComment) {
          socket.join(post.id)
        }
      }
    } catch (error) {
      console.error('Error handling connection:', error);
    }
  }

  async handleDisconnect(socket: Socket) {
    const data = await this.postService.decodeHeader(socket);
    if (!data) return;
    if (!("id" in data)) return;
    const userId = data.id;
    if (!userId) socket.disconnect();
    this.connectedClients.delete(userId);
  }

  getConnectedClients(): string[] {
    return Array.from(this.connectedClients.keys());
  }
}
