import { MigrationInterface, QueryRunner } from "typeorm";

export class InitArtist1793114786998 implements MigrationInterface {
    name = 'InitArtist1793114786998'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "artist" ("id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "spotifyId" character varying, "spotifyUrl" character varying, CONSTRAINT "UQ_4b811e711bf96bb5ce3516f9bf5" UNIQUE ("spotifyId"), CONSTRAINT "PK_55b76e71568b5db4d01d3e394ed" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "artist"`);
    }

}
