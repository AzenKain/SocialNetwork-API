import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomchatService } from './roomchat.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/user/type/user.entity';
import { Global } from '@nestjs/common';

@Global()
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
      this.connectedClients.get(userId).join(roomId);
    }
    catch (err) {
      return;
    }
  }
  
  async addMembersRoomchat(roomId: string, userId: string[]) {
    for (let i = 0; i < userId.length; i++)  {
      try {
        this.connectedClients.get(userId[i]).join(roomId);
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
        this.connectedClients.get(userId[i]).leave(roomId);
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

  async notification(roomId: string, title: string,data: any) {
    if (roomId === 'AllSERVER') {
      this.server.emit(title, data)
      return;
    }
    this.server.to(roomId).emit(title, data)
  }

  async handleConnection(socket: Socket) {
    const data = await this.roomchatService.getPayloadFromSocket(socket);
    try {
      if (data == null) {
        socket.disconnect();
        return;
      }
      if (!data.id) {
        socket.disconnect();
        return;
      }
      const userId = data.id;
      this.connectedClients.set(userId, socket);
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
        const roomchats = await this.roomchatService.getAllRomchatByUserId(userId);
        if (roomchats.length == 0) return;
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
    if (!data) return;
    if (!("id" in data)) return;
    const userId = data.id;
    this.connectedClients.delete(userId)
    const user = await this.userRespository.findOne({
      where: {
        id: userId
      }
    })
    if (!user) return;
    user.isOnline = false;
    this.userRespository.save(user);
  }

  getConnectedClients(): string[] {
    return Array.from(this.connectedClients.keys());
  }
}
