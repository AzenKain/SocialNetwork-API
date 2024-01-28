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
    title: string;

    @Column()
    isSingle: boolean;

    @Column()
    isDisplay: boolean;

    @Column()
    isBlock: boolean;

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

    @Column("simple-json")
    memberNickname: Record<string, string>;
    
    @CreateDateColumn()
    created_at: Date;
        
    @UpdateDateColumn()
    updated_at: Date;
}