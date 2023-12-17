import { InteractionType } from "src/interaction/interaction.type";
import { FileType } from "src/media/type";
import { Column, CreateDateColumn, Entity, ObjectIdColumn, PrimaryColumn, UpdateDateColumn } from "typeorm";


@Entity()
export class Message {
    @ObjectIdColumn()
    _id: string;

    @PrimaryColumn()
    id: string;
    
    @Column()
    UserId: string;

    @Column()
    isDisplay: boolean;

    @Column()
    content: string;

    @Column("simple-json")
    data: FileType[];

    @Column("simple-json")
    interaction: InteractionType[];
    
    @CreateDateColumn()
    created_at: Date;
        
    @UpdateDateColumn()
    updated_at: Date;
}