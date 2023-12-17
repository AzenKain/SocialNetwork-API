import { ForbiddenException, Injectable } from '@nestjs/common';
import { FirebaseService } from 'src/firebase/firebase.service';
import { getDownloadURL, ref ,uploadBytesResumable, deleteObject } from 'firebase/storage';
import { v5 as uuidv5 } from 'uuid';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { FileUpload } from './type';

@Injectable()
export class MediaService {
    
    constructor(
        private fireBase : FirebaseService,
        @InjectRepository(FileUpload) private fileRespository: Repository<FileUpload>,
    ) {}

    async uploadFile(file : Express.Multer.File, userId : string) {
        const dateTime = Date.now();
        const uniqueFileName = `${dateTime}_${file.originalname}`;
        const storageRef = ref(this.fireBase.storage, uniqueFileName)
        const metadata = {
            contentType: file.mimetype,
        }
        const fileStream = await uploadBytesResumable(storageRef, file.buffer, metadata);

        const dowloadUrl = await getDownloadURL(fileStream.ref);
        const tmpData = {
            id: uuidv5(dowloadUrl, uuidv5.URL),
            url: dowloadUrl,
            userId: userId
        }
        const dataSave = this.fileRespository.create(tmpData)
        return await this.fileRespository.save(dataSave)
    }

    async deleteFile(id : string) {
        const fileInfo = await this.fileRespository.findOne({
            where: {
                id: id,
            }
        })

        if (!fileInfo) {
            throw new ForbiddenException(
                'This file does not exist',
            );
        }
        const storageRef = ref(this.fireBase.storage, fileInfo.url)

        await deleteObject(storageRef);

        return "Delete file completed!"

    }

    async getFile(id : string) {
        const fileInfo = await this.fileRespository.findOne({
            where: {
                id: id,
            }
        })

        if (!fileInfo) {
            throw new ForbiddenException(
                'This file does not exist',
            );
        }
        return fileInfo;

    }
}
