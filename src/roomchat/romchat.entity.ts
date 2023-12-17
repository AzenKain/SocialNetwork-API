import { FileType } from "src/media/type";
import { MessageType } from "src/message/message.type";
import { Column, CreateDateColumn, Entity, ObjectIdColumn, PrimaryColumn, UpdateDateColumn } from "typeorm";


@Entity()
export class Roomchat {
    @ObjectIdColumn()
    _id: string;

    @PrimaryColumn()
    id: string;

    @Column()
    isSingle: boolean;

    @Column()
    ownerUserId: string;

    @Column()
    description: string | null;

    @Column()
    imgDisplay: string | null;
    
    @Column()
    member: string[];

    @Column("simple-json")
    data: MessageType[];
    
    @CreateDateColumn()
    created_at: Date;
        
    @UpdateDateColumn()
    updated_at: Date;
}