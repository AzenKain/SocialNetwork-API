import { IsString, IsNotEmpty } from "class-validator";

export class CommandDto {
    @IsString()
    @IsNotEmpty()
    userId: string;

    @IsString()
    @IsNotEmpty()
    adminId: string;

    @IsString()
    @IsNotEmpty()
    command: string;
}