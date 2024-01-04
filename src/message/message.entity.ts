import { InteractionType } from "src/interaction/interaction.type";
import { Column, CreateDateColumn, Entity, ObjectIdColumn, PrimaryColumn, UpdateDateColumn } from "typeorm";


@Entity()
export class Message {
    @ObjectIdColumn()
    _id: string;

    @PrimaryColumn()
    id: string;
    
    @Column()
    userId: string;

    @Column()
    roomId: string;
    
    @Column()
    isDisplay: boolean;

    @Column()
    content: string;

    @Column()
    fileUrl: string[] | null;

    @Column("simple-json")
    interaction: InteractionType[] | null;
    
    @CreateDateColumn()
    created_at: Date;
        
    @UpdateDateColumn()
    updated_at: Date;
}