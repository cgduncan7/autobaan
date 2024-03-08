import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddMonitors1709910503052 implements MigrationInterface {
	name = 'AddMonitors1709910503052'

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "monitors" ("id" varchar PRIMARY KEY NOT NULL, "type" varchar(32) NOT NULL, "createdAt" datetime NOT NULL, "data" blob NOT NULL)`,
		)
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE "monitors"`)
	}
}
