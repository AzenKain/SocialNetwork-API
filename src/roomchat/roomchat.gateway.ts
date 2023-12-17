import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomchatService } from './roomchat.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/user/user.entity';

@WebSocketGateway()
export class RoomchatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  connectedClients: Map<string, Socket> = new Map<string, Socket>();

  constructor(
    private roomchatService: RoomchatService,
    @InjectRepository(User) private userRespository: Repository<User>,
  ) { }


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

  @SubscribeMessage('sendMessage')
  async sendMessage(@ConnectedSocket() socket: Socket, @MessageBody() payload: any) {
    await this.roomchatService.getPayloadFromSocket(socket);
    const newMessage = await this.roomchatService.sendMessage(payload);
    this.server.to(payload.roomchatId).emit("newMessage", newMessage);
  }

  afterInit(socket: Socket) {

  }

  async notification(roomId: string, message: string) {
    this.server.to(roomId).emit("notification", message)
  }

  async handleConnection(socket: Socket) {
    const data = await this.roomchatService.getPayloadFromSocket(socket);
    try {
      const userId = data.id;
      if (!userId) socket.disconnect();
      this.connectedClients.set(userId, socket);
      socket.join(userId);
      const user = await this.userRespository.findOne({
        where: {
          id: userId
        }
      })
      user.isOnline = true;
      this.userRespository.save(user);
      if (userId) {
        const roomchats = await this.roomchatService.getAllRomchatByUserId(userId);
        if (!roomchats) return;
        for (const roomchat of roomchats) {
          socket.join(roomchat.id)
        }
      }
    } catch (error) {
      console.error('Error handling connection:', error);
    }
  }

  async handleDisconnect(socket: Socket) {
    const data = await this.roomchatService.decodeHeader(socket);
    const userId = data.id;
    if (!userId) socket.disconnect();
    this.connectedClients.delete(userId)
    const user = await this.userRespository.findOne({
      where: {
        id: userId
      }
    })
    user.isOnline = false;
    this.userRespository.save(user);
  }

  getConnectedClients(): string[] {
    return Array.from(this.connectedClients.keys());
  }
}
