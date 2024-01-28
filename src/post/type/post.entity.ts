import { InteractionType } from "src/interaction/interaction.type";
import { MessageType } from "src/message/message.type";
import { Column, CreateDateColumn, Entity, ObjectIdColumn, PrimaryColumn, UpdateDateColumn } from "typeorm";


@Entity()
export class PostEntity {
    @ObjectIdColumn()
    _id: string;

    @PrimaryColumn()
    id: string;
    
    @Column()
    ownerUserId: string;

    @Column()
    type: string;

    @Column()
    linkedShare: string | null;

    @Column()
    content: string | null;

    @Column()
    fileUrl: string[];
    
    @Column()
    isDisplay: boolean;

    @Column("simple-json")
    interaction: InteractionType[];

    @Column("simple-json")
    comment: MessageType[];
    
    @CreateDateColumn()
    created_at: Date;
        
    @UpdateDateColumn()
    updated_at: Date;
}
