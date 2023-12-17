import { Column, CreateDateColumn, Entity, ObjectIdColumn, PrimaryColumn, UpdateDateColumn } from "typeorm";


@Entity()
export class FileUpload {
    @ObjectIdColumn()
    _id: string;

    @PrimaryColumn()
    id: string;

    @Column()
    url: string;
    
    @Column()
    userId: string;

    @CreateDateColumn()
    created_at: Date;
        
    @UpdateDateColumn()
    updated_at: Date;
}