import { Body, Controller, Delete, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtGuardRestApiRefresh } from './guard';
import { AdminDto, CommandDto } from './dto';
import { RoomchatGateway } from 'src/roomchat/roomchat.gateway';

@UseGuards(JwtGuardRestApiRefresh)
@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private romchatGatway: RoomchatGateway
    ){}

    @Post('addAdmin')
    async addAdmin(
        @Body() dto : AdminDto,
    ) {
        return this.authService.addAdmin(dto)
    }

    @Post('banUser')
    async banUser(
        @Body() dto :  CommandDto
    ) {
        const data = await this.authService.commandAdmin(dto);
        if (data.status == true) {
            this.romchatGatway.notification(dto.userId, "banned", dto);
        } 
        return data;
    }

    @Post('unbanUser')
    async unbanUser(
        @Body() dto :  CommandDto
    ) {
        return await this.authService.commandAdmin(dto);
    }
    
    @Delete('removeAdmin')
    async removeAdmin(
        @Body() dto : CommandDto
    ) {
        return await this.authService.commandAdmin(dto);
    }
}
