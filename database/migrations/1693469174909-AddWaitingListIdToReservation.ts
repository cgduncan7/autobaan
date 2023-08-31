import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddWaitingListIdToReservation1693469174909
	implements MigrationInterface
{
	name = 'AddWaitingListIdToReservation1693469174909'

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "temporary_reservations" ("id" varchar PRIMARY KEY NOT NULL, "username" varchar(64) NOT NULL, "password" varchar(255) NOT NULL, "dateRangeStart" datetime NOT NULL, "dateRangeEnd" datetime NOT NULL, "opponentId" varchar(32) NOT NULL, "opponentName" varchar(255) NOT NULL, "waitListed" boolean NOT NULL DEFAULT (0), "waitingListId" integer)`,
		)
		await queryRunner.query(
			`INSERT INTO "temporary_reservations"("id", "username", "password", "dateRangeStart", "dateRangeEnd", "opponentId", "opponentName", "waitListed") SELECT "id", "username", "password", "dateRangeStart", "dateRangeEnd", "opponentId", "opponentName", "waitListed" FROM "reservations"`,
		)
		await queryRunner.query(`DROP TABLE "reservations"`)
		await queryRunner.query(
			`ALTER TABLE "temporary_reservations" RENAME TO "reservations"`,
		)
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "reservations" RENAME TO "temporary_reservations"`,
		)
		await queryRunner.query(
			`CREATE TABLE "reservations" ("id" varchar PRIMARY KEY NOT NULL, "username" varchar(64) NOT NULL, "password" varchar(255) NOT NULL, "dateRangeStart" datetime NOT NULL, "dateRangeEnd" datetime NOT NULL, "opponentId" varchar(32) NOT NULL, "opponentName" varchar(255) NOT NULL, "waitListed" boolean NOT NULL DEFAULT (0))`,
		)
		await queryRunner.query(
			`INSERT INTO "reservations"("id", "username", "password", "dateRangeStart", "dateRangeEnd", "opponentId", "opponentName", "waitListed") SELECT "id", "username", "password", "dateRangeStart", "dateRangeEnd", "opponentId", "opponentName", "waitListed" FROM "temporary_reservations"`,
		)
		await queryRunner.query(`DROP TABLE "temporary_reservations"`)
	}
}
