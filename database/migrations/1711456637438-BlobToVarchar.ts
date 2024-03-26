import { MigrationInterface, QueryRunner } from 'typeorm'

export class BlobToVarchar1711456637438 implements MigrationInterface {
	name = 'BlobToVarchar1711456637438'

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "monitors" DROP COLUMN "data";`)
		await queryRunner.query(
			`ALTER TABLE "monitors" ADD COLUMN "data" varchar NOT NULL;`,
		)
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "monitors" DROP COLUMN "data";`)
		await queryRunner.query(
			`ALTER TABLE "monitors" ADD COLUMN "data" blob NOT NULL;`,
		)
	}
}
