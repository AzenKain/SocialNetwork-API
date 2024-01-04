import { Body, Controller, Delete, Get, Param, Post, UploadedFile, UseGuards, UseInterceptors} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { FileType } from './type';
import { JwtGuardRestApi } from 'src/auth/guard';

@UseGuards(JwtGuardRestApi)
@Controller('media')
export class MediaController {
    constructor(
        private mediaService : MediaService
    ){}
    
    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    uploadFile(
        @Body('userId') userId : string,
        @UploadedFile() file: Express.Multer.File
    ) : Promise<FileType> {
        return this.mediaService.uploadFile(file, userId);
    }

    @Delete('delete')
    deleteFile(@Body('id') id :string) {
        return this.mediaService.deleteFile(id);
    }

    @Get(':id')
    getFile(@Param('id') id: string) {
        return this.mediaService.getFile(id);
    }
}
