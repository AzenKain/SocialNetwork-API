import { MessageType } from "src/message/message.type";
import { Column, CreateDateColumn, Entity, ObjectIdColumn, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { MemberOutType } from "./romchat.type";


@Entity()
export class Roomchat {
    @ObjectIdColumn()
    _id: string;

    @PrimaryColumn()
    id: string;

    @Column()
    isDisplay: boolean;

    @Column()
    ownerUserId: string;

    @Column()
    description: string | null;

    @Column()
    imgDisplay: string | null;
    
    @Column()
    member: string[];
    
    @Column("simple-json")
    memberOut : MemberOutType[];

    @Column("simple-json")
    data: MessageType[];
    
    @CreateDateColumn()
    created_at: Date;
        
    @UpdateDateColumn()
    updated_at: Date;
}