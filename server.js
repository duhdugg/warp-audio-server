#!/bin/env node

const path = require('path')
const { exec } = require('child_process')
const express = require('express')
const { urlValidator } = require('@preaction/validation')

const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)

app.use('/media', express.static(path.join(__dirname, 'media')))
app.use('/', express.static(path.join(__dirname, 'build')))

io.on('connection', (socket) => {
  socket.on('warp-request', (state, fn) => {
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

const port = process.env.PORT || 8712
http.listen(port, () => {
  console.log(`now listening on port ${port}`)
})
