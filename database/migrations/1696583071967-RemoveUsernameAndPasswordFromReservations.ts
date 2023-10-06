import { MigrationInterface, QueryRunner } from 'typeorm'

export class RemoveUsernameAndPasswordFromReservations1696583071967
	implements MigrationInterface
{
	name = 'RemoveUsernameAndPasswordFromReservations1696583071967'

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "temporary_reservations" ("id" varchar PRIMARY KEY NOT NULL, "dateRangeStart" datetime NOT NULL, "dateRangeEnd" datetime NOT NULL, "opponentId" varchar(32) NOT NULL, "opponentName" varchar(255) NOT NULL, "waitListed" boolean NOT NULL DEFAULT (0), "waitingListId" integer)`,
		)
		await queryRunner.query(
			`INSERT INTO "temporary_reservations"("id", "dateRangeStart", "dateRangeEnd", "opponentId", "opponentName", "waitListed", "waitingListId") SELECT "id", "dateRangeStart", "dateRangeEnd", "opponentId", "opponentName", "waitListed", "waitingListId" FROM "reservations"`,
		)
		await queryRunner.query(`DROP TABLE "reservations"`)
		await queryRunner.query(
			`ALTER TABLE "temporary_reservations" RENAME TO "reservations"`,
		)
		await queryRunner.query(
			`CREATE TABLE "temporary_recurring_reservations" ("id" varchar PRIMARY KEY NOT NULL, "dayOfWeek" integer NOT NULL, "timeStart" varchar(6) NOT NULL, "timeEnd" varchar(6) NOT NULL, "opponentId" varchar(32) NOT NULL, "opponentName" varchar(255) NOT NULL)`,
		)
		await queryRunner.query(
			`INSERT INTO "temporary_recurring_reservations"("id", "dayOfWeek", "timeStart", "timeEnd", "opponentId", "opponentName") SELECT "id", "dayOfWeek", "timeStart", "timeEnd", "opponentId", "opponentName" FROM "recurring_reservations"`,
		)
		await queryRunner.query(`DROP TABLE "recurring_reservations"`)
		await queryRunner.query(
			`ALTER TABLE "temporary_recurring_reservations" RENAME TO "recurring_reservations"`,
		)
		await queryRunner.query(
			`CREATE TABLE "temporary_reservations" ("id" varchar PRIMARY KEY NOT NULL, "dateRangeStart" datetime NOT NULL, "dateRangeEnd" datetime NOT NULL, "opponentId" varchar(32) NOT NULL, "opponentName" varchar(255) NOT NULL, "waitListed" boolean NOT NULL DEFAULT (0), "waitingListId" integer, "ownerId" varchar(32) NOT NULL)`,
		)
		await queryRunner.query(
			`INSERT INTO "temporary_reservations"("id", "dateRangeStart", "dateRangeEnd", "opponentId", "opponentName", "waitListed", "waitingListId", "ownerId") SELECT "id", "dateRangeStart", "dateRangeEnd", "opponentId", "opponentName", "waitListed", "waitingListId", "unknown" FROM "reservations"`,
		)
		await queryRunner.query(`DROP TABLE "reservations"`)
		await queryRunner.query(
			`ALTER TABLE "temporary_reservations" RENAME TO "reservations"`,
		)
		await queryRunner.query(
			`CREATE TABLE "temporary_recurring_reservations" ("id" varchar PRIMARY KEY NOT NULL, "dayOfWeek" integer NOT NULL, "timeStart" varchar(6) NOT NULL, "timeEnd" varchar(6) NOT NULL, "opponentId" varchar(32) NOT NULL, "opponentName" varchar(255) NOT NULL, "ownerId" varchar(32) NOT NULL)`,
		)
		await queryRunner.query(
			`INSERT INTO "temporary_recurring_reservations"("id", "dayOfWeek", "timeStart", "timeEnd", "opponentId", "opponentName", "ownerId") SELECT "id", "dayOfWeek", "timeStart", "timeEnd", "opponentId", "opponentName", "unknown" FROM "recurring_reservations"`,
		)
		await queryRunner.query(`DROP TABLE "recurring_reservations"`)
		await queryRunner.query(
			`ALTER TABLE "temporary_recurring_reservations" RENAME TO "recurring_reservations"`,
		)
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "recurring_reservations" RENAME TO "temporary_recurring_reservations"`,
		)
		await queryRunner.query(
			`CREATE TABLE "recurring_reservations" ("id" varchar PRIMARY KEY NOT NULL, "dayOfWeek" integer NOT NULL, "timeStart" varchar(6) NOT NULL, "timeEnd" varchar(6) NOT NULL, "opponentId" varchar(32) NOT NULL, "opponentName" varchar(255) NOT NULL)`,
		)
		await queryRunner.query(
			`INSERT INTO "recurring_reservations"("id", "dayOfWeek", "timeStart", "timeEnd", "opponentId", "opponentName") SELECT "id", "dayOfWeek", "timeStart", "timeEnd", "opponentId", "opponentName" FROM "temporary_recurring_reservations"`,
		)
		await queryRunner.query(`DROP TABLE "temporary_recurring_reservations"`)
		await queryRunner.query(
			`ALTER TABLE "reservations" RENAME TO "temporary_reservations"`,
		)
		await queryRunner.query(
			`CREATE TABLE "reservations" ("id" varchar PRIMARY KEY NOT NULL, "dateRangeStart" datetime NOT NULL, "dateRangeEnd" datetime NOT NULL, "opponentId" varchar(32) NOT NULL, "opponentName" varchar(255) NOT NULL, "waitListed" boolean NOT NULL DEFAULT (0), "waitingListId" integer)`,
		)
		await queryRunner.query(
			`INSERT INTO "reservations"("id", "dateRangeStart", "dateRangeEnd", "opponentId", "opponentName", "waitListed", "waitingListId") SELECT "id", "dateRangeStart", "dateRangeEnd", "opponentId", "opponentName", "waitListed", "waitingListId" FROM "temporary_reservations"`,
		)
		await queryRunner.query(`DROP TABLE "temporary_reservations"`)
		await queryRunner.query(
			`ALTER TABLE "recurring_reservations" RENAME TO "temporary_recurring_reservations"`,
		)
		await queryRunner.query(
			`CREATE TABLE "recurring_reservations" ("id" varchar PRIMARY KEY NOT NULL, "username" varchar(64) NOT NULL, "password" varchar(255) NOT NULL, "dayOfWeek" integer NOT NULL, "timeStart" varchar(6) NOT NULL, "timeEnd" varchar(6) NOT NULL, "opponentId" varchar(32) NOT NULL, "opponentName" varchar(255) NOT NULL)`,
		)
		await queryRunner.query(
			`INSERT INTO "recurring_reservations"("id", "dayOfWeek", "timeStart", "timeEnd", "opponentId", "opponentName") SELECT "id", "dayOfWeek", "timeStart", "timeEnd", "opponentId", "opponentName" FROM "temporary_recurring_reservations"`,
		)
		await queryRunner.query(`DROP TABLE "temporary_recurring_reservations"`)
		await queryRunner.query(
			`ALTER TABLE "reservations" RENAME TO "temporary_reservations"`,
		)
		await queryRunner.query(
			`CREATE TABLE "reservations" ("id" varchar PRIMARY KEY NOT NULL, "username" varchar(64) NOT NULL, "password" varchar(255) NOT NULL, "dateRangeStart" datetime NOT NULL, "dateRangeEnd" datetime NOT NULL, "opponentId" varchar(32) NOT NULL, "opponentName" varchar(255) NOT NULL, "waitListed" boolean NOT NULL DEFAULT (0), "waitingListId" integer)`,
		)
		await queryRunner.query(
			`INSERT INTO "reservations"("id", "dateRangeStart", "dateRangeEnd", "opponentId", "opponentName", "waitListed", "waitingListId") SELECT "id", "dateRangeStart", "dateRangeEnd", "opponentId", "opponentName", "waitListed", "waitingListId" FROM "temporary_reservations"`,
		)
		await queryRunner.query(`DROP TABLE "temporary_reservations"`)
	}
}
