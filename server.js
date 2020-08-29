#!/bin/env node

const bodyParser = require('body-parser')
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const express = require('express')
const bcrypt = require('bcryptjs')
const session = require('express-session')
const MemoryStore = require('memorystore')(session)
const { urlValidator } = require('@preaction/validation')

const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)

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
app.use('/', express.static(path.join(__dirname, 'build')))
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
  Session(socket.request, socket.request.res, next)
})

io.on('connection', (socket) => {
  socket.on('warp-request', (state, fn) => {
    if (!socket.conn.request.session.authenticated) {
      return
    }
    if (urlValidator(state.url) || !state.url) {
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
