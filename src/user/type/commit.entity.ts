import { Column, CreateDateColumn, Entity, ObjectIdColumn, PrimaryColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class CommitEntity {
    @ObjectIdColumn()
    _id: string;

    @PrimaryColumn()
    id: string;

    @Column()
    createdUserId: string;

    @Column()
    receiveUserId: string;

    @Column()
    value: boolean;

    @CreateDateColumn()
    created_at: Date;
        
    @UpdateDateColumn()
    updated_at: Date;
}