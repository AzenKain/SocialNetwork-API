import { Column, CreateDateColumn, Entity, ObjectIdColumn, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { NotificationType } from "./notification.type";
import { ProfileType } from "./user.type";

@Entity({ name: 'user' })
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
    role: string;
    
    @Column()
    isOnline: boolean;

    @Column()
    friends: string[];

    @Column()
    bookMarks: string[];

    @Column("simple-json")
    detail: ProfileType;
    
    @Column("simple-json")
    notification: NotificationType[];

    @Column()
    premiumTime: Date | null;

    @CreateDateColumn()
    created_at: Date;
        
    @UpdateDateColumn()
    updated_at: Date;
}