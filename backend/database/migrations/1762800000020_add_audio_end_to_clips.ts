import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'clips'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.float('audio_end').notNullable().defaultTo(0)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('audio_end')
    })
  }
}
