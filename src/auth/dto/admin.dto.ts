import { IsString, IsNotEmpty } from "class-validator";

export class AdminDto {
    @IsString()
    @IsNotEmpty()
    userId: string;

    @IsString()
    @IsNotEmpty()
    secretKey: string;
}