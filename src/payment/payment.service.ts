import { ForbiddenException, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import * as crypto from 'crypto';
import { firstValueFrom } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/type/user.entity';
import { Repository } from 'typeorm';
import { PaymentDto } from './dto';

@Injectable()
export class PaymentService {

    constructor(
        private readonly httpService: HttpService,
        @InjectRepository(User) private userRepository: Repository<User>,
        ) { }
        
        async getUser(userId: string): Promise<User> {
            const user = await this.userRepository.findOne({
                where : {
                    id : userId
                }
            });
    
            if (!user)
                throw new ForbiddenException(
                    'This user does not exist',
                );
            delete user.hash;
            delete user.refreshToken;
            return user;
        }

    
    async generateMomo(payment: PaymentDto)  {
        let amount = "0";
        let gift = "";
        if (payment.select == "1") {
            amount = "30000"
            gift = "1 month"
        }
        else if (payment.select == "2") {
            amount = "150000"
            gift = "6 months"
        }
        else if (payment.select == "3") {
            amount = "350000"
            gift = "12 months"
        }
        const dataUserLocal = await this.getUser(payment.userId)
        const dataItem = {
            id: '204727',
            name: 'Premium gift ' + gift,
            description: 'Super ultra luxury',
            imageUrl: 'https://momo.vn/uploads/product1.jpg',
            manufacturer: 'BlackcatStudio',
          };

          const dataUser = {
            name: dataUserLocal.detail.name,
            phoneNumber: dataUserLocal.detail.phoneNumber,
            email: dataUserLocal.email,
          };
  
        const partnerCode = 'MOMO';
        const accessKey = 'F8BBA842ECF85';
        const secretKey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
        const requestId = partnerCode + new Date().getTime();
        const orderId = requestId;
        const orderInfo = 'Premium gift ' + gift ;
        const redirectUrl = 'https://momo.vn/return';
        const ipnUrl = 'https://callback.url/notify';
        const requestType = 'payWithCC';
        const extraData = '';
    
        const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
    
        const signature = crypto.createHmac('sha256', secretKey)
          .update(rawSignature)
          .digest('hex');
    


        const requestBody = {
          partnerCode,
          accessKey,
          requestId,
          amount,
          orderId,
          orderInfo,
          redirectUrl,
          ipnUrl,
          extraData,
          requestType,
          signature,
          lang: 'vi',
          items: [dataItem], 
          userInfo: dataUser,
        };
    
        const momoEndpoint = 'https://test-payment.momo.vn/v2/gateway/api/create';
    
        const httpOptions = {
          headers: {
            'Content-Type': 'application/json',
          },
        };
    
        const dataRe = await firstValueFrom(
            this.httpService.post(momoEndpoint, requestBody, httpOptions))
        if (!("message" in dataRe.data)) {
            return {status: "fail", url: ""}
        }
        return {status: dataRe.data.message, url: dataRe.data.payUrl};
      }
}