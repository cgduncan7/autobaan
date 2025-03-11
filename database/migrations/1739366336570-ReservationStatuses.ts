import { MigrationInterface, QueryRunner } from 'typeorm'

export class ReservationStatuses1739366336570 implements MigrationInterface {
	name = 'ReservationStatuses1739366336570'

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "temporary_reservations" ("id" varchar PRIMARY KEY NOT NULL, "dateRangeStart" datetime NOT NULL, "dateRangeEnd" datetime NOT NULL, "status" varchar(32) NOT NULL DEFAULT ('pending'), "waitingListId" integer, "ownerId" varchar(32) NOT NULL, "opponents" json NOT NULL)`,
		)
		await queryRunner.query(
			`INSERT INTO "temporary_reservations"("id", "dateRangeStart", "dateRangeEnd", "status", "waitingListId", "ownerId", "opponents") SELECT "id", "dateRangeStart", "dateRangeEnd", CASE "waitListed" WHEN true THEN "on_waiting_list" ELSE "pending" END, "waitingListId", "ownerId", "opponents" FROM "reservations"`,
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
			`CREATE TABLE "reservations" ("id" varchar PRIMARY KEY NOT NULL, "dateRangeStart" datetime NOT NULL, "dateRangeEnd" datetime NOT NULL, "waitListed" boolean NOT NULL DEFAULT (0), "waitingListId" integer, "ownerId" varchar(32) NOT NULL, "opponents" json NOT NULL)`,
		)
		await queryRunner.query(
			`INSERT INTO "reservations"("id", "dateRangeStart", "dateRangeEnd", "waitListed", "waitingListId", "ownerId", "opponents") SELECT "id", "dateRangeStart", "dateRangeEnd", CASE "status" WHEN "on_waiting_list" THEN true ELSE false, "waitingListId", "ownerId", "opponents" FROM "temporary_reservations"`,
		)
		await queryRunner.query(`DROP TABLE "temporary_reservations"`)
	}
}
