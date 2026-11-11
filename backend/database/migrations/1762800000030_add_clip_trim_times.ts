import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'clips'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.float('video_start').notNullable().defaultTo(0)
      table.float('video_end').notNullable().defaultTo(0)
      table.float('audio_start').notNullable().defaultTo(0)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('video_start')
      table.dropColumn('video_end')
      table.dropColumn('audio_start')
    })
  }
}
