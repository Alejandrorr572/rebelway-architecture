import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSong1793114792432 implements MigrationInterface {
    name = 'InitSong1793114792432'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "song" ("id" SERIAL NOT NULL, "title" character varying(255) NOT NULL, "duration_ms" integer NOT NULL, "cover_url" character varying NOT NULL, "preview_url" character varying, "artistid" integer NOT NULL, "spotifyId" character varying, CONSTRAINT "UQ_1cdadc2cd4977bf206354f0dee3" UNIQUE ("spotifyId"), CONSTRAINT "PK_baaa977f861cce6ff954ccee285" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "song"`);
    }

}
