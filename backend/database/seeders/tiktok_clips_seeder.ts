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
  ['kpop', 'editBTS.mp4'], ['kpop', 'bts2.mp4'],
  ['dorama', 'dorama.mp4'], ['dorama', 'dorama2.mp4'], ['dorama', 'editMyNameDorama.mp4'],
  ['anime', 'dmls.mp4'], ['anime', 'naruto.mp4'],
  ['cinema', 'movies.mp4'], ['cinema', 'odisseia.mp4'], ['cinema', 'srna.mp4'],
  ['futebol', 'mengo.mp4'], ['futebol', 'ney.mp4'], ['futebol', 'ney2.mp4'],
  ['futebol', 'paqueta.mp4'], ['futebol', 'paqueta2.mp4'], ['futebol', 'vasco.mp4'],
  ['futebol', 'vasco2.mp4'], ['futebol', 'vasco3.mp4'],
] as const

const metadata = [
  ['BTS em uma noite inesquecível', 'Uma edição especial com a energia e a presença de palco do BTS.'],
  ['O momento que todo ARMY esperava', 'Um recorte marcante para reviver aquele momento favorito.'],
  ['Uma cena para guardar', 'Uma cena intensa de dorama com emoção do começo ao fim.'],
  ['Quando o olhar diz tudo', 'Aquele encontro silencioso que fala mais do que qualquer diálogo.'],
  ['My Name: acerto de contas', 'Uma edição cheia de tensão, atitude e cenas inesquecíveis.'],
  ['O poder desperta', 'Um edit de anime com ação, impacto e uma virada memorável.'],
  ['Naruto nunca desiste', 'Um momento de determinação para quem acompanha essa jornada.'],
  ['Cenas que ficam na memória', 'Uma seleção cinematográfica para quem ama grandes momentos na tela.'],
  ['Uma viagem para outro mundo', 'Atmosfera, aventura e imagens que parecem saídas de uma odisseia.'],
  ['O instante antes da virada', 'Uma edição de filme com clima, tensão e um final marcante.'],
  ['A paixão rubro-negra', 'Energia de arquibancada e futebol para vibrar junto.'],
  ['Neymar em estado puro', 'Habilidade, velocidade e aquele lance que merece replay.'],
  ['Quando o craque resolve', 'Um momento de talento e criatividade dentro de campo.'],
  ['Paquetá comanda o jogo', 'Intensidade e personalidade em uma edição do camisa 10.'],
  ['A classe de Paquetá', 'Um recorte curto com técnica, visão e muita presença.'],
  ['Vasco até o fim', 'A força da torcida e a paixão pelo Gigante da Colina.'],
  ['Um sentimento inexplicável', 'Um momento vascaíno para cantar, lembrar e compartilhar.'],
  ['Vamos juntos, Vasco', 'A torcida empurra e o time responde em mais um grande momento.'],
] as const

export default class TikTokClipsSeeder extends BaseSeeder {
  static environment = ['development', 'test']

  async run() {
    const existingClips = await Clip.query().where('userId', 'seed-tiktok').orderBy('id', 'asc')
    let inserted = 0
    let updated = 0

    for (const [index, [communityKey, filename]] of clips.entries()) {
      const community = communities[communityKey]
      const data = {
        title: metadata[index][0],
        description: metadata[index][1],
        category: community.category,
        community: community.id,
        music: 'Áudio original',
        musicId: null,
        creator: 'Plataforma de Clipes',
        userId: 'seed-tiktok',
        duration: '0:30',
        videoStart: 0,
        videoEnd: 0,
        audioStart: 0,
        audioEnd: 0,
        art: community.art,
        theme: community.theme,
        status: 'Publicado',
        mediaFilename: `assets/videos/${communityKey === 'cinema' ? 'filmes e series' : communityKey}/${filename}`,
        mediaType: 'video/mp4',
        audioFilename: null,
        audioType: null,
        tiktokUrl: null,
        views: 0,
        likes: 0,
      }
      if (existingClips[index]) {
        existingClips[index].merge(data)
        await existingClips[index].save()
        updated++
      } else {
        await Clip.create(data)
        inserted++
      }
    }

    console.log(`Vídeos locais: ${inserted} novos, ${updated} atualizados.`)
  }
}
