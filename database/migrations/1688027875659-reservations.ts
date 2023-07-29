import { MigrationInterface, QueryRunner } from 'typeorm'

export class Reservations1688027875659 implements MigrationInterface {
	name = 'Reservations1688027875659'

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE IF NOT EXISTS "reservations" ("id" varchar PRIMARY KEY NOT NULL, "username" varchar(64) NOT NULL, "password" varchar(255) NOT NULL, "dateRangeStart" datetime NOT NULL, "dateRangeEnd" datetime NOT NULL, "opponentId" varchar(32) NOT NULL, "opponentName" varchar(255) NOT NULL)`,
		)
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE IF EXISTS "reservations"`)
	}
}
