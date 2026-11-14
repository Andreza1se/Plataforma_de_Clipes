import Clip from '#models/clip'
import app from '@adonisjs/core/services/app'
import vine from '@vinejs/vine'
import { randomUUID } from 'node:crypto'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import type { HttpContext } from '@adonisjs/core/http'

const createClipValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(4).maxLength(80),
    description: vine.string().trim().minLength(10).maxLength(300),
    community: vine.string().trim().maxLength(80),
    category: vine.string().trim().maxLength(80),
    music: vine.string().trim().maxLength(160).optional(),
    musicId: vine.string().trim().maxLength(40).optional(),
    creator: vine.string().trim().minLength(2).maxLength(80),
    userId: vine.string().trim().minLength(1).maxLength(80),
    duration: vine.string().trim().maxLength(8).optional(),
    videoStart: vine.number().min(0).optional(),
    videoEnd: vine.number().min(0).optional(),
    audioStart: vine.number().min(0).optional(),
    audioEnd: vine.number().min(0).optional(),
    art: vine.string().trim().maxLength(16).optional(),
    theme: vine.string().trim().maxLength(40).optional(),
    tiktokUrl: vine.string().trim().url().maxLength(500).optional(),
  })
)

const allowedVideoTypes: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
}

function isTikTokUrl(value: string) {
  try {
    const url = new URL(value)
    return (
      url.protocol === 'https:' &&
      ['tiktok.com', 'www.tiktok.com'].includes(url.hostname) &&
      /\/video\/\d+/.test(url.pathname)
    )
  } catch {
    return false
  }
}

function serialize(clip: Clip) {
  const mediaUrl = clip.mediaFilename?.startsWith('assets/')
    ? `/${clip.mediaFilename.split('/').map(encodeURIComponent).join('/')}`
    : clip.mediaFilename
      ? `/media/${clip.mediaFilename}`
      : undefined

  return {
    id: `server-${clip.id}`,
    title: clip.title,
    description: clip.description,
    category: clip.category,
    community: clip.community,
    music: clip.music,
    musicId: clip.musicId,
    creator: clip.creator,
    userId: clip.userId,
    views: clip.views,
    likes: clip.likes,
    duration: clip.duration,
    videoStart: clip.videoStart || 0,
    videoEnd: clip.videoEnd || 0,
    audioStart: clip.audioStart || 0,
    audioEnd: clip.audioEnd || 0,
    art: clip.art,
    theme: clip.theme,
    date: clip.createdAt.toRelative({ locale: 'pt-BR' }) || 'agora',
    status: clip.status,
    url: mediaUrl,
    audioUrl: clip.audioFilename ? `/media/${clip.audioFilename}` : undefined,
    tiktokUrl: clip.tiktokUrl,
    comments: [],
  }
}

export default class ClipsController {
  async index({ response }: HttpContext) {
    const clips = await Clip.query().orderBy('createdAt', 'desc')
    return response.json(clips.map(serialize))
  }

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(createClipValidator)
    const video = request.file('video', {
      size: '20mb',
      extnames: ['mp4', 'webm', 'mov'],
    })
    const audio = request.file('audio', {
      size: '20mb',
      extnames: ['mp3', 'webm'],
    })

    if (video?.hasErrors) {
      return response.badRequest({ message: 'Arquivo inválido ou acima de 20 MB.' })
    }
    const videoExtension = video?.extname?.toLowerCase()
    if (video && (!videoExtension || !['mp4', 'webm', 'mov'].includes(videoExtension))) {
      return response.badRequest({ message: 'Formato de vídeo não suportado.' })
    }
    const audioExtension = audio?.extname?.toLowerCase()
    const audioTypes: Record<string, string> = {
      mp3: 'audio/mpeg',
      webm: 'audio/webm',
    }
    if (audio?.hasErrors || (audio && (!audioExtension || !audioTypes[audioExtension]))) {
      return response.badRequest({ message: 'Envie uma trilha MP3 ou WebM válida de até 20 MB.' })
    }
    if (audio && !video) {
      return response.badRequest({
        message: 'A trilha MP3 só pode ser sobreposta a um vídeo enviado.',
      })
    }
    if (
      audio &&
      (payload.videoStart === undefined ||
        payload.videoEnd === undefined ||
        payload.audioStart === undefined ||
        payload.audioEnd === undefined ||
        payload.videoEnd <= payload.videoStart ||
        Math.abs(payload.videoEnd - payload.videoStart - (payload.audioEnd - payload.audioStart)) >
          0.11)
    ) {
      return response.badRequest({
        message: 'O trecho de áudio precisa ter a mesma duração do trecho de vídeo.',
      })
    }
    if (!video && (!payload.tiktokUrl || !isTikTokUrl(payload.tiktokUrl))) {
      return response.badRequest({ message: 'Envie um vídeo ou um link público do TikTok.' })
    }

    let mediaFilename: string | null = null
    let mediaType: string | null = null
    let audioFilename: string | null = null
    let audioType: string | null = null
    if (video) {
      const extension = videoExtension!
      mediaFilename = `${randomUUID()}.${extension}`
      mediaType =
        allowedVideoTypes[video.type || ''] ||
        (extension === 'mov' ? 'video/quicktime' : `video/${extension}`)
      const mediaDirectory = app.makePath('storage', 'clips')
      await mkdir(mediaDirectory, { recursive: true })
      await video.move(mediaDirectory, { name: mediaFilename })
      if (video.hasErrors) {
        return response.badRequest({ message: 'Não foi possível salvar o vídeo.' })
      }
    }
    if (audio) {
      audioFilename = `audio-${randomUUID()}.${audioExtension}`
      audioType = audioTypes[audioExtension!]
      const mediaDirectory = app.makePath('storage', 'clips')
      await mkdir(mediaDirectory, { recursive: true })
      await audio.move(mediaDirectory, { name: audioFilename })
      if (audio.hasErrors) {
        return response.badRequest({ message: 'Não foi possível salvar o MP3.' })
      }
    }

    const clip = await Clip.create({
      ...payload,
      music: payload.music || null,
      musicId: payload.musicId || null,
      duration: payload.duration || '0:30',
      videoStart: payload.videoStart || 0,
      videoEnd: payload.videoEnd || 0,
      audioStart: payload.audioStart || 0,
      audioEnd: payload.audioEnd || 0,
      art: payload.art || '🎞️',
      theme: payload.theme || 'thumb-field',
      status: 'Pendente',
      mediaFilename,
      mediaType,
      audioFilename,
      audioType,
      tiktokUrl: payload.tiktokUrl || null,
      views: 0,
      likes: 0,
    })

    return response.created(serialize(clip))
  }

  async update({ params, request, response }: HttpContext) {
    const clip = await Clip.find(Number(params.id))
    if (!clip) return response.notFound({ message: 'Clipe não encontrado.' })

    const status = request.input('status')
    if (status !== 'Pendente' && status !== 'Publicado') {
      return response.badRequest({ message: 'Estado de publicação inválido.' })
    }

    clip.status = status
    await clip.save()
    return response.json(serialize(clip))
  }

  async media({ params, request, response }: HttpContext) {
    if (!/^(audio-)?[a-f0-9-]+\.(mp4|webm|mov|mp3)$/.test(params.filename)) {
      return response.notFound()
    }
    const mediaPath = path.join(app.makePath('storage', 'clips'), params.filename)
    if (!existsSync(mediaPath)) return response.notFound()
    const clip =
      (await Clip.findBy('mediaFilename', params.filename)) ||
      (await Clip.findBy('audioFilename', params.filename))
    const contentType = clip
      ? clip.mediaFilename === params.filename
        ? clip.mediaType
        : clip.audioType
      : null
    if (!contentType) return response.notFound()
    const size = statSync(mediaPath).size
    const range = request.header('range')
    response.header('Content-Type', contentType)
    response.header('Content-Disposition', 'inline')
    response.header('Accept-Ranges', 'bytes')

    if (!range) {
      response.header('Content-Length', String(size))
      return response.stream(createReadStream(mediaPath))
    }

    const match = /^bytes=(\d*)-(\d*)$/.exec(range)
    if (!match || (!match[1] && !match[2])) {
      response.header('Content-Range', `bytes */${size}`)
      return response.status(416)
    }

    const suffixLength = match[1] ? 0 : Number(match[2])
    const start = match[1] ? Number(match[1]) : Math.max(0, size - suffixLength)
    const end = match[2] && match[1] ? Math.min(Number(match[2]), size - 1) : size - 1
    if (start >= size || end < start || (suffixLength === 0 && !match[1])) {
      response.header('Content-Range', `bytes */${size}`)
      return response.status(416)
    }

    response.status(206)
    response.header('Content-Range', `bytes ${start}-${end}/${size}`)
    response.header('Content-Length', String(end - start + 1))
    return response.stream(createReadStream(mediaPath, { start, end }))
  }

  async assetMedia({ params, request, response }: HttpContext) {
    const category = decodeURIComponent(params.category || '')
    const filename = decodeURIComponent(params.filename || '')
    const categories = new Set(['kpop', 'dorama', 'anime', 'futebol', 'filmes e series'])
    if (!categories.has(category) || !/^[\w.-]+\.mp4$/i.test(filename)) return response.notFound()

    const mediaPath = app.makePath('../assets/videos', category, filename)
    if (!existsSync(mediaPath)) return response.notFound()
    const size = statSync(mediaPath).size
    response.header('Content-Type', 'video/mp4')
    response.header('Content-Disposition', 'inline')
    response.header('Accept-Ranges', 'bytes')
    const range = request.header('range')
    if (!range) {
      response.header('Content-Length', String(size))
      return response.stream(createReadStream(mediaPath))
    }
    const match = /^bytes=(\d*)-(\d*)$/.exec(range)
    if (!match || (!match[1] && !match[2])) {
      response.header('Content-Range', `bytes */${size}`)
      return response.status(416)
    }
    const suffixLength = match[1] ? 0 : Number(match[2])
    const start = match[1] ? Number(match[1]) : Math.max(0, size - suffixLength)
    const end = match[2] && match[1] ? Math.min(Number(match[2]), size - 1) : size - 1
    if (start >= size || end < start) {
      response.header('Content-Range', `bytes */${size}`)
      return response.status(416)
    }
    response.status(206)
    response.header('Content-Range', `bytes ${start}-${end}/${size}`)
    response.header('Content-Length', String(end - start + 1))
    return response.stream(createReadStream(mediaPath, { start, end }))
  }
}
