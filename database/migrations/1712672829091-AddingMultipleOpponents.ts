import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddingMultipleOpponents1712672829091
	implements MigrationInterface
{
	name = 'AddingMultipleOpponents1712672829091'

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "temporary_reservations" ("id" varchar PRIMARY KEY NOT NULL, "dateRangeStart" datetime NOT NULL, "dateRangeEnd" datetime NOT NULL, "waitListed" boolean NOT NULL DEFAULT (0), "waitingListId" integer, "ownerId" varchar(32) NOT NULL, "opponents" json NOT NULL)`,
		)
		await queryRunner.query(
			`INSERT INTO "temporary_reservations"("id", "dateRangeStart", "dateRangeEnd", "waitListed", "waitingListId", "ownerId", "opponents") SELECT "id", "dateRangeStart", "dateRangeEnd", "waitListed", "waitingListId", "ownerId", json_array(json_object('id', "opponentId", 'name', "opponentName")) as "opponents" FROM "reservations"`,
		)
		await queryRunner.query(`DROP TABLE "reservations"`)
		await queryRunner.query(
			`ALTER TABLE "temporary_reservations" RENAME TO "reservations"`,
		)
		await queryRunner.query(
			`CREATE TABLE "temporary_recurring_reservations" ("id" varchar PRIMARY KEY NOT NULL, "dayOfWeek" integer NOT NULL, "timeStart" varchar(6) NOT NULL, "timeEnd" varchar(6) NOT NULL, "ownerId" varchar(32) NOT NULL, "opponents" json NOT NULL)`,
		)
		await queryRunner.query(
			`INSERT INTO "temporary_recurring_reservations"("id", "dayOfWeek", "timeStart", "timeEnd", "ownerId", "opponents") SELECT "id", "dayOfWeek", "timeStart", "timeEnd", "ownerId", json_array(json_object('id', "opponentId", 'name', "opponentName")) as "opponents" FROM "recurring_reservations"`,
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
			`CREATE TABLE "recurring_reservations" ("id" varchar PRIMARY KEY NOT NULL, "dayOfWeek" integer NOT NULL, "timeStart" varchar(6) NOT NULL, "timeEnd" varchar(6) NOT NULL, "opponentId" varchar(32) NOT NULL, "opponentName" varchar(255) NOT NULL, "ownerId" varchar(32) NOT NULL)`,
		)
		await queryRunner.query(
			`INSERT INTO "recurring_reservations"("id", "dayOfWeek", "timeStart", "timeEnd", "ownerId", "opponentId", "opponentName") SELECT "id", "dayOfWeek", "timeStart", "timeEnd", "ownerId", "opponents"->0->>'id' as "opponentId", "opponents"->0->>'name' as "opponentName" FROM "temporary_recurring_reservations"`,
		)
		await queryRunner.query(`DROP TABLE "temporary_recurring_reservations"`)
		await queryRunner.query(
			`ALTER TABLE "reservations" RENAME TO "temporary_reservations"`,
		)
		await queryRunner.query(
			`CREATE TABLE "reservations" ("id" varchar PRIMARY KEY NOT NULL, "dateRangeStart" datetime NOT NULL, "dateRangeEnd" datetime NOT NULL, "opponentId" varchar(32) NOT NULL, "opponentName" varchar(255) NOT NULL, "waitListed" boolean NOT NULL DEFAULT (0), "waitingListId" integer, "ownerId" varchar(32) NOT NULL)`,
		)
		await queryRunner.query(
			`INSERT INTO "reservations"("id", "dateRangeStart", "dateRangeEnd", "waitListed", "waitingListId", "ownerId", "opponentId", "opponentName") SELECT "id", "dateRangeStart", "dateRangeEnd", "waitListed", "waitingListId", "ownerId", "opponents"->0->>'id' as "opponentId", "opponents"->0->>'name' as "opponentName" FROM "temporary_reservations"`,
		)
		await queryRunner.query(`DROP TABLE "temporary_reservations"`)
	}
}
