/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import { controllers } from '#generated/controllers'
import ClipsController from '#controllers/clips_controller'
import app from '@adonisjs/core/services/app'
import router from '@adonisjs/core/services/router'
import { readFile } from 'node:fs/promises'

const clips = new ClipsController()

router
  .get('/', async ({ response }) => {
    response.type('html')
    return response.send(await readFile(app.makePath('../index.html')))
  })
  .as('home')

router.get('/style.css', async ({ response }) => {
  response.type('css')
  return response.send(await readFile(app.makePath('../style.css')))
})

router.get('/app.js', async ({ response }) => {
  response.type('js')
  return response.send(await readFile(app.makePath('../app.js')))
})

router.get('/api/clips', (ctx) => clips.index(ctx))
router.post('/api/clips', (ctx) => clips.store(ctx))
router.patch('/api/clips/:id', (ctx) => clips.update(ctx))
router.get('/media/:filename', (ctx) => clips.media(ctx))

router
  .group(() => {
    router.get('signup', [controllers.NewAccount, 'create'])
    router.post('signup', [controllers.NewAccount, 'store'])

    router.get('login', [controllers.Session, 'create'])
    router.post('login', [controllers.Session, 'store'])
  })
  .use(middleware.guest())

router
  .group(() => {
    router.on('/dashboard').render('pages/dashboard').as('dashboard')
    router.post('logout', [controllers.Session, 'destroy'])
  })
  .use(middleware.auth())
