import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class Clip extends BaseModel {
  static table = 'clips'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare title: string

  @column()
  declare description: string

  @column()
  declare category: string

  @column()
  declare community: string

  @column()
  declare music: string | null

  @column()
  declare musicId: string | null

  @column()
  declare creator: string

  @column()
  declare userId: string

  @column()
  declare duration: string

  @column()
  declare videoStart: number

  @column()
  declare videoEnd: number

  @column()
  declare audioStart: number

  @column()
  declare audioEnd: number

  @column()
  declare art: string

  @column()
  declare theme: string

  @column()
  declare status: string

  @column()
  declare mediaFilename: string | null

  @column()
  declare mediaType: string | null

  @column()
  declare audioFilename: string | null

  @column()
  declare audioType: string | null

  @column()
  declare tiktokUrl: string | null

  @column()
  declare views: number

  @column()
  declare likes: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
