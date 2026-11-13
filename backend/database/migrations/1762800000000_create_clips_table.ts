import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'clips'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('title', 80).notNullable()
      table.string('description', 300).notNullable()
      table.string('category', 80).notNullable()
      table.string('community', 80).notNullable()
      table.string('music', 160).nullable()
      table.string('music_id', 40).nullable()
      table.string('creator', 80).notNullable()
      table.string('user_id', 80).notNullable()
      table.string('duration', 8).notNullable().defaultTo('0:30')
      table.integer('video_start').nullable().defaultTo(0)
      table.integer('video_end').nullable().defaultTo(0)
      table.integer('audio_start').nullable().defaultTo(0)
      table.string('art', 16).notNullable().defaultTo('🎞️')
      table.string('theme', 40).notNullable().defaultTo('thumb-field')
      table.string('status', 20).notNullable().defaultTo('Pendente')
      table.string('media_filename', 120).nullable()
      table.string('media_type', 80).nullable()
      table.string('tiktok_url', 500).nullable()
      table.integer('views').notNullable().defaultTo(0)
      table.integer('likes').notNullable().defaultTo(0)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
