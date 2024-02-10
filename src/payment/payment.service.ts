import { ForbiddenException, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import * as crypto from 'crypto';
import { firstValueFrom } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/type/user.entity';
import { Repository } from 'typeorm';
import { PaymentDto } from './dto';
import { Request } from 'express';
import { format } from 'date-fns';
import { stringify } from 'qs';
import { BillEntity } from './type/bill.entity';
import * as otpGenerator from 'otp-generator';
import { v5 as uuidv5 } from 'uuid';

@Injectable()
export class PaymentService {

    constructor(
        private readonly httpService: HttpService,
        @InjectRepository(User) private userRepository: Repository<User>,
        @InjectRepository(BillEntity) private billRepository: Repository<BillEntity>,
    ) { }

    async getUser(userId: string) {
        const user = await this.userRepository.findOne({
            where: {
                id: userId
            }
        });

        if (!user)
            throw new ForbiddenException(
                'This user does not exist',
            );
        return user;
    }


    async generateMomo(payment: PaymentDto) {
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

        let generatedOTP: string = otpGenerator.generate(10, {digits: false, upperCaseAlphabets: false, specialChars: false });
        let billId: string = uuidv5(payment.userId + "bill" + generatedOTP, uuidv5.URL);

        while (true) {
            const roomSelect =  await this.billRepository.findOne({
                where: {
                    id: billId
                }
            });
            if (roomSelect) {
                generatedOTP = otpGenerator.generate(10, {digits: false, upperCaseAlphabets: false, specialChars: false });
                billId = uuidv5(payment.userId + "bill" + generatedOTP, uuidv5.URL);
            }
            else {
                break;
            }
        }

        const billTmp = this.billRepository.create({
            id: billId,
            userId: payment.userId,
            isComplete: false,
            typeGift: payment.select,
        })

        await this.billRepository.save(billTmp);


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
        const orderInfo = 'Premium gift ' + gift;
        const redirectUrl = 'https://momo.vn/return';
        const ipnUrl = `http://103.155.161.116:3434/payment/validate/${payment.userId}/${billTmp.id}`
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
            return { status: "fail", url: "" }
        }
        return { status: dataRe.data.message, url: dataRe.data.payUrl };
    }

    async generateVnpay(payment: PaymentDto, req: Request) {
        let amount = 0;
        let gift = "";
        if (payment.select == "1") {
            amount = 30000
            gift = "1 month"
        }
        else if (payment.select == "2") {
            amount = 150000
            gift = "6 months"
        }
        else if (payment.select == "3") {
            amount = 350000
            gift = "12 months"
        }

        let generatedOTP: string = otpGenerator.generate(10, {digits: false, upperCaseAlphabets: false, specialChars: false });
        let billId: string = uuidv5(payment.userId + "bill" + generatedOTP, uuidv5.URL);

        while (true) {
            const roomSelect =  await this.billRepository.findOne({
                where: {
                    id: billId
                }
            });
            if (roomSelect) {
                generatedOTP = otpGenerator.generate(10, {digits: false, upperCaseAlphabets: false, specialChars: false });
                billId = uuidv5(payment.userId + "bill" + generatedOTP, uuidv5.URL);
            }
            else {
                break;
            }
        }

        const billTmp = this.billRepository.create({
            id: billId,
            userId: payment.userId,
            isComplete: false,
            typeGift: payment.select
        })

        await this.billRepository.save(billTmp);

        const ipAddr = req.headers['x-forwarded-for'];

        const tmnCode = "CGXZLS0Z";
        const secretKey = "XNBCJFAKAZQSGTARRLGCHVZWCIOIGSHN"
        const vnpUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
        const returnUrl = `http://103.155.161.116:3434/payment/validate/${payment.userId}/${billTmp.id}`

        const date = new Date();
        const createDate = format(date, 'yyyyMMddHHmmss');

        // Ví dụ: Định dạng ngày tháng theo yêu cầu 'HHmmss'
        const orderId = format(date, 'HHmmss');

        const currCode = 'VND';
        const vnp_Params: any = {};
        vnp_Params['vnp_Version'] = '2.1.0';
        vnp_Params['vnp_Command'] = 'pay';
        vnp_Params['vnp_TmnCode'] = tmnCode;
        vnp_Params['vnp_Locale'] = "vn";
        vnp_Params['vnp_CurrCode'] = currCode;
        vnp_Params['vnp_TxnRef'] = orderId;
        vnp_Params['vnp_OrderInfo'] = 'Premium gift ' + gift;
        vnp_Params['vnp_OrderType'] = "billpayment";
        vnp_Params['vnp_Amount'] = amount * 100;
        vnp_Params['vnp_ReturnUrl'] = returnUrl;
        vnp_Params['vnp_IpAddr'] = ipAddr;
        vnp_Params['vnp_CreateDate'] = createDate;
        vnp_Params['vnp_BankCode'] = 'VNBANK';

        const sortedParams = this.sortObject(vnp_Params);
        const signData = stringify(sortedParams, { encode: false });
        const hmac = crypto.createHmac("sha512", secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");
        sortedParams['vnp_SecureHash'] = signed;

        const vnpRedirectUrl = vnpUrl + '?' + stringify(sortedParams, { encode: false });


        return { status: 'Ok', url: vnpRedirectUrl };
    }
    
    async validateGift(userId: string, billId: string) {
        const user = await this.getUser(userId);
        const bill = await this.billRepository.findOne({
            where: {
                id: billId,
            }
        })
        if (bill.isComplete === true) {
            throw new ForbiddenException(
                'this bill is completed',
            );
        }
        bill.isComplete = true;
        const currentDate = new Date();
        let numberOfMonths = 0;
        if (bill.typeGift == "0") {
            numberOfMonths = 1;
        }
        else if (bill.typeGift == "1") {
            numberOfMonths = 6;
        }
        else if (bill.typeGift == "1") {
            numberOfMonths = 12;
        }
        if (new Date(user.premiumTime) < currentDate) {

            const newDate = new Date(currentDate.setMonth(currentDate.getMonth() + numberOfMonths))
            user.premiumTime = newDate;
        }
        else {
            const tmpDate = new Date(user.premiumTime);
            const newDate = new Date(tmpDate.setMonth(tmpDate.getMonth() + numberOfMonths))
            user.premiumTime = newDate;
        }
        await this.userRepository.save(user);
        await this.billRepository.save(bill);
        return
    }

    private sortObject(obj: any) {
        const sorted = {};
        const str = [];
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                str.push(encodeURIComponent(key));
            }
        }
        str.sort();
        for (let key = 0; key < str.length; key++) {
            sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
        }
        return sorted;
    }
}