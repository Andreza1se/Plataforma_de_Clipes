import Clip from '#models/clip'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

const communities = {
  kpop: { id: 'army', name: 'ARMY', category: 'K-pop', art: '💜', theme: 'thumb-stage' },
  dorama: {
    id: 'doramas',
    name: 'Dorameiros',
    category: 'Doramas',
    art: '🎞️',
    theme: 'thumb-stage',
  },
  anime: {
    id: 'anime',
    name: 'Anime edits',
    category: 'Anime',
    art: '🌸',
    theme: 'thumb-road',
  },
  cinema: {
    id: 'cinema',
    name: 'Cena & série',
    category: 'Séries',
    art: '🎬',
    theme: 'thumb-field',
  },
  futebol: {
    id: 'neymar',
    name: 'Brasileirão',
    category: 'Futebol',
    art: '⚽',
    theme: 'thumb-ball',
  },
}

const clips = [
  ['kpop', 'dpxygi', '7584917218102627639'],
  ['kpop', 'ryupjmn', '7650275186280877319'],
  ['dorama', 'rinareimin', '7648837868626005255'],
  ['dorama', 'ktsyui', '7679453307622165767'],
  ['dorama', 'i7fundos', '7240827876646440197'],
  ['anime', 'sge.cc1', '7597737066771877175'],
  ['anime', '.uzumaky', '7702171909164649750'],
  ['cinema', 'that.is.cinema', '7652627376186166559'],
  ['cinema', 'klyx473', '7664276139682188576'],
  ['cinema', 'greenvleaf', '7669026213033299232'],
  ['futebol', 'kiqoprdz', '7666923293248736534'],
  ['futebol', 'njr.rnz', '7440113873455238455'],
  ['futebol', 'futszedits', '7646382613992688904'],
  ['futebol', 'primexz81', '7656539710168272146'],
  ['futebol', 'thhnlzx', '7704482219808673030'],
  ['futebol', 'crvg.gigante', '7704489644519443730'],
  ['futebol', 'vittoac', '7613067480298163477'],
  ['futebol', 'vittoac', '7643830920805551380'],
] as const

export default class TikTokClipsSeeder extends BaseSeeder {
  static environment = ['development', 'test']

  async run() {
    const existingClips = await Clip.query().whereNotNull('tiktokUrl')
    const existingVideoIds = new Set(
      existingClips
        .map((clip) => clip.tiktokUrl?.match(/\/video\/(\d+)/)?.[1])
        .filter((videoId): videoId is string => Boolean(videoId))
    )
    let inserted = 0

    for (const [communityKey, creator, videoId] of clips) {
      if (existingVideoIds.has(videoId)) continue

      const community = communities[communityKey]
      await Clip.create({
        title: `${community.name} · @${creator}`,
        description: `Clipe público do TikTok de @${creator}.`,
        category: community.category,
        community: community.id,
        music: 'Áudio do TikTok',
        musicId: null,
        creator: `@${creator}`,
        userId: 'seed-tiktok',
        duration: '0:30',
        videoStart: 0,
        videoEnd: 0,
        audioStart: 0,
        audioEnd: 0,
        art: community.art,
        theme: community.theme,
        status: 'Publicado',
        mediaFilename: null,
        mediaType: null,
        audioFilename: null,
        audioType: null,
        tiktokUrl: `https://www.tiktok.com/@${creator}/video/${videoId}`,
        views: 0,
        likes: 0,
      })
      existingVideoIds.add(videoId)
      inserted++
    }

    console.log(`TikTok seed: ${inserted} novos clipes adicionados.`)
  }
}
