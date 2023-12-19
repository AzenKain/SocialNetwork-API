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
    isDisplay: boolean;

    @Column()
    content: string;

    @Column()
    fileUrl: string[];

    @Column("simple-json")
    interaction: InteractionType[];
    
    @CreateDateColumn()
    created_at: Date;
        
    @UpdateDateColumn()
    updated_at: Date;
}