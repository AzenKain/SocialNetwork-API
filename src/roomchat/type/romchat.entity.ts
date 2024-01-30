import { MessageType } from "src/message/message.type";
import { Column, CreateDateColumn, Entity, ObjectIdColumn, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { MemberOutType, MemberRoleType } from "./romchat.type";


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
    isBlock: string | null;

    @Column()
    ownerUserId: string;

    @Column()
    description: string | null;

    @Column()
    imgDisplay: string | null;
    
    @Column()
    member: string[];

    @Column("simple-json")
    memberNickname: Record<string, string> | null;

    @Column("simple-json")
    role: Record<string, MemberRoleType[]> | null;

    @Column("simple-json")
    memberOut : MemberOutType[];

    @Column("simple-json")
    data: MessageType[];
    
    @CreateDateColumn()
    created_at: Date;
        
    @UpdateDateColumn()
    updated_at: Date;
}