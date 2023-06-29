import { MigrationInterface, QueryRunner } from 'typeorm'

export class RecurringReservations1688027875660 implements MigrationInterface {
	name = 'RecurringReservations1688027875660'

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "recurring_reservations" ("id" varchar PRIMARY KEY NOT NULL, "username" varchar(64) NOT NULL, "password" varchar(255) NOT NULL, "dayOfWeek" integer NOT NULL, "timeStart" varchar(6) NOT NULL, "timeEnd" varchar(6) NOT NULL, "opponentId" varchar(32) NOT NULL, "opponentName" varchar(255) NOT NULL)`,
		)
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE "recurring_reservations"`)
	}
}
