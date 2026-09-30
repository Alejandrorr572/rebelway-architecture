import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

@Entity()
export class Artist {
    //DB model for an Artist
    @PrimaryGeneratedColumn()
    id: number

    @Column({
        length: 255,
    })
    name: string

    @Column({
        unique: true,
        nullable: true
    })
    spotifyId: string

    @Column({
        nullable: true
    })
    spotifyUrl: string
}

