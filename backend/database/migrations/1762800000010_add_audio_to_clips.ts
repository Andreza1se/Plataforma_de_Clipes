import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'clips'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('audio_filename', 120).nullable()
      table.string('audio_type', 80).nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('audio_filename')
      table.dropColumn('audio_type')
    })
  }
}
