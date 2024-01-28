import { Column, CreateDateColumn, Entity, ObjectIdColumn, PrimaryColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: 'otpCode' })
export class OtpCode {
    @ObjectIdColumn()
    _id: string;

    @PrimaryColumn()
    id: string;

    @Column()
    email: string;
    
    @Column()
    otpCode: string;

    @Column()
    type: string;

    @Column()
    value: boolean; 

    @Column()
    isDisplay: boolean;

    @CreateDateColumn()
    created_at: Date;
        
    @UpdateDateColumn()
    updated_at: Date;
}