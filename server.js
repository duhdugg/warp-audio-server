#!/usr/bin/env node

import bodyParser from 'body-parser'
import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import express from 'express'
import bcrypt from 'bcryptjs'
import session from 'express-session'
import memorystore from 'memorystore'
import { createServer } from 'http'
import { Server } from 'socket.io'

const __dirname = import.meta.dirname
const MemoryStore = memorystore(session)
const app = express()
const http = createServer(app)
const io = new Server(http)

const sessionConfig = {
  secret: String(+new Date()) + String(Math.random()),
  name: 'warp-audio-session',
  cookie: {
    sameSite: 'strict',
    secure: process.env.WARP_COOKIE_SECURE,
  },
  store: new MemoryStore({
    checkPeriod: 24 * 60 * 60 * 1000, // un dia
  }),
  proxy: !!process.env.WARP_COOKIE_PROXY,
  resave: false,
  saveUninitialized: false,
}

const urlValidator = (value) => {
  try {
    new URL(value)
    return true
  } catch (e) {
    return false
  }
}

const Session = session(sessionConfig)
app.use(Session)
app.use(bodyParser.json())

const authenticationRequired = (req, res, next) => {
  if (!req.session.authenticated) {
    return res.status(401).send('')
  }
  next()
}

app.use(
  '/media',
  authenticationRequired,
  express.static(path.join(__dirname, 'media'))
)
app.use('/', express.static(path.join(__dirname, 'dist')))
app
  .route('/api/session')
  .get((req, res) => {
    res.json(req.session)
  })
  .post((req, res) => {
    if (bcrypt.compareSync(req.body.pw, pw)) {
      req.session.authenticated = true
      res.json(req.session)
    } else {
      res.status(401).json({})
    }
  })

io.use((socket, next) => {
  Session(socket.request, {}, next)
})

io.on('connection', (socket) => {
  socket.on('warp-request', (state, fn) => {
    console.debug(state)
    if (!socket.conn.request.session.authenticated) {
      console.error('UNAUTHENTICATED_REQUEST')
      return
    }
    if (!urlValidator(state.url) || !state.url) {
      console.error('VALIDATION_FAIL')
      return
    }
    fn()
    const url = state.url
    const shiftPitch = state.shiftPitch || '0'
    const stretchTempo = state.stretchTempo || '1'
    console.debug(url, shiftPitch, stretchTempo)
    exec(
      `bash ${path.join(
        __dirname,
        'warp.sh'
      )} "${url}" "${shiftPitch}" "${stretchTempo}"`,
      {},
      (error, stdout, stderr) => {
        if (error) {
          console.error('error', error)
          socket.emit('warp-error', state)
        } else {
          console.debug('success')
          socket.emit('warp-complete', state)
        }
        console.debug('stdout', stdout)
        console.error('stderr', stderr)
      }
    )
  })
})

let pw
try {
  pw = fs.readFileSync(path.resolve(__dirname, '.pw'), 'utf-8')
} catch (e) {
  pw = String(+new Date()) + String(Math.random())
  const salt = bcrypt.genSaltSync()
  console.log(`pw not set. setting to: ${pw}`)
  pw = bcrypt.hashSync(pw, salt)
  console.log('to set, execute: npm run set-password')
}

const port = process.env.PORT || 8712
http.listen(port, () => {
  console.log(`now listening on port ${port}`)
})
