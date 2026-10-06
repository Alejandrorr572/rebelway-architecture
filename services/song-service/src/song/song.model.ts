import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

@Entity()
export class Song {
    //DB model for a Song
    @PrimaryGeneratedColumn()
    id: number

    @Column({
        length: 255,
    })
    title: string

    @Column("int")
    duration_ms: number

    @Column()
    cover_url: string

    @Column({
        nullable: true
    })
    preview_url: string

    @Column()
    artistid: number

    @Column({
        unique: true,
        nullable: true
    })
    spotifyId: string
}


