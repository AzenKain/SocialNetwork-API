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

  connectedClients: Map<string, string[]> = new Map<string, string[]>();
  
  constructor(
    private postService: PostService,
    @InjectRepository(User) private userRespository: Repository<User>,
  ) { }


  afterInit(socket: Socket) {

  }
  async addMemberRoomchat(roomId: string, userId: string) {
    try {
      const socketId = this.connectedClients.get(userId);
      if (socketId == undefined) return
      for (let j = 0; j < socketId.length; j++) {
        const socketClient = this.server.sockets.sockets.get(socketId[j]);
        if (socketClient == undefined) continue;
        socketClient.join(roomId);
      }
    }
    catch (err) {
      return;
    }
  }
  
  async addMembersRoomchat(roomId: string, userId: string[]) {
    for (let i = 0; i < userId.length; i++)  {
      try {
        const socketId = this.connectedClients.get(userId[i]);
        if (socketId == undefined) continue;
        for (let j = 0; j < socketId.length; j++) {
          const socketClient = this.server.sockets.sockets.get(socketId[j]);
          if (socketClient == undefined) continue;
          socketClient.join(roomId);
        }
      }
      catch (err) {
        continue;
      }
    }
    return;
  }

  async leaveMembersRoomchat(roomId: string, userId: string[]) {
    for (let i = 0; i < userId.length; i++)  {
      try {
        const socketId = this.connectedClients.get(userId[i]);
        if (socketId == undefined) continue;
        for (let j = 0; j < socketId.length; j++) {
          const socketClient = this.server.sockets.sockets.get(socketId[j]);
          if (socketClient == undefined) continue;
          socketClient.leave(roomId);
        }
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
    if (!data) return;
    if (!("id" in data)) return;
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
      const dataSocket = this.connectedClients.get(userId)
      if (dataSocket == undefined) {
        this.connectedClients.set(userId, [socket.id])
      }
      else {
        this.connectedClients.set(userId, [...dataSocket, socket.id])
      }
      socket.join(userId);
      const user = await this.userRespository.findOne({
        where: {
          id: userId
        }
      })
      if (!user) return;
      user.isOnline = true;
      await this.userRespository.save(user);
      if (userId) {
        const postOwner = await this.postService.getAllPostByUserId(userId);
        if (postOwner.length > 0) {
          for (const post of postOwner) {
            socket.join(post.id)
          }
        }
        const postComment = await this.postService.getAllPostByUserIdComment(userId);
        if (postComment.length > 0) {
          for (const post of postComment) {
            socket.join(post.id)
          }
        }
      }
    } catch (error) {
      console.error('Error handling connection:', error);
    }
  }

  async handleDisconnect(socket: Socket) {
    this.connectedClients.forEach((socketIds, userId) => {
      if (socketIds.includes(socket.id)) {
        const updatedSocketIds = socketIds.filter(id => id !== socket.id);
        this.connectedClients.set(userId, updatedSocketIds);
      }
    });
  
  }

  getConnectedClients(): string[] {
    return Array.from(this.connectedClients.keys());
  }
}
