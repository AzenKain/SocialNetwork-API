import { Column, CreateDateColumn, Entity, ObjectIdColumn, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { NotificationType } from "./notification.type";
import { ProfileType } from "./user.type";

@Entity()
export class User {
    @ObjectIdColumn()
    _id: string;

    @PrimaryColumn()
    id: string;

    @Column()
    email: string;

    @Column()
    hash: string;

    @Column()
    refreshToken: string;

    @Column()
    isOnline: boolean;

    @Column()
    friends: string[];

    @Column("simple-json")
    detail: ProfileType;
    
    @Column("simple-json")
    notification: NotificationType[];

    @CreateDateColumn()
    created_at: Date;
        
    @UpdateDateColumn()
    updated_at: Date;
}