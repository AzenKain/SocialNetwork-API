import { ForbiddenException, Injectable } from '@nestjs/common';
import { FirebaseService } from 'src/firebase/firebase.service';
import { getDownloadURL, ref ,uploadBytesResumable, deleteObject } from 'firebase/storage';
import { v5 as uuidv5 } from 'uuid';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { FileUpload } from './type';
import { User } from 'src/user/type/user.entity';

@Injectable()
export class MediaService {
    
    constructor(
        private fireBase : FirebaseService,
        @InjectRepository(FileUpload) private fileRepository: Repository<FileUpload>,
        @InjectRepository(User) private userRepository: Repository<User>,
    ) {}

    async uploadFile(file : Express.Multer.File, userId : string) {
        const user = await this.userRepository.findOne({
            where: {
                id: userId
            }
        })

        if (!user) {
            throw new ForbiddenException(
                'This user does not exist',
            );
        }
        if (new Date(user.premiumTime) < new Date() && file.size > 50000000) {
            throw new ForbiddenException(
                "Basic users must only send files under 50mb",
            );
        }

        const dateTime = Date.now();
        let uniqueFileName = `${dateTime}_`;
        if ("originalname" in file) {
            uniqueFileName = `${dateTime}_${file.originalname}`;
        }
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
        const dataSave = this.fileRepository.create(tmpData)
        return await this.fileRepository.save(dataSave)
    }

    async deleteFile(id : string) {
        const fileInfo = await this.fileRepository.findOne({
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

        return {response: "Delete file completed!"}

    }

    async getFileByID(id : string) {
        const fileInfo = await this.fileRepository.findOne({
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

    async getFileByUrl(url : string) {
        const fileInfo = await this.fileRepository.findOne({
            where: {
                url: url,
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
