#!/bin/env node

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

const oneYear = 365 * 24 * 60 * 60 * 1000
const sessionConfig = {
  secret: String(+new Date()) + String(Math.random()),
  name: 'warp-audio-session',
  cookie: {
    maxAge: oneYear,
    sameSite: 'strict',
    secure: process.env.WARP_COOKIE_SECURE,
  },
  store: new MemoryStore({
    checkPeriod: oneYear / 365,
  }),
  proxy: !!process.env.WARP_COOKIE_PROXY,
  resave: false,
  saveUninitialized: false,
}

const Session = session(sessionConfig)
app.use(Session)

app.use('/media', express.static(path.join(__dirname, 'media')))
app.use('/', express.static(path.join(__dirname, 'build')))

io.use((socket, next) => {
  Session(socket.request, socket.request.res, next)
})

io.on('connection', (socket) => {
  socket.on('session-request', (state, fn) => {
    fn(socket.conn.request.session)
  })

  socket.on('login-request', (state, fn) => {
    let retval = false
    const authenticate = () => {
      state.conn.request.session.authenticated = true
    }
    bcrypt.compare(state.password, pw, (err, response) => {
      if (!err && response) {
        authenticate()
        retval = true
      }
      fn(retval)
    })
  })

  socket.on('warp-request', (state, fn) => {
    if (!socket.conn.request.session.authenticated) {
      return
    }
    fn()
    if (urlValidator(state.url) || !state.url) {
      return
    }
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
  pw = fs.readFileSync(path.resolve(__dirname, '.pw'))
} catch (e) {
  pw = String(+new Date()) + String(Math.random())
  const salt = bcrypt.genSaltSync()
  console.log(`pw not set. setting to: ${pw}`)
  pw = bcrypt.hashSync(pw, salt)
  console.log('to set, execute: npm run set-pw')
}

const port = process.env.PORT || 8712
http.listen(port, () => {
  console.log(`now listening on port ${port}`)
})
