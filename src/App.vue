<script>
import axios from 'axios'
import { nextTick } from 'vue'
import { io } from 'socket.io-client'
const formData = () => ({
  url: '',
  shiftPitch: 0.0,
  stretchTempo: 1.0,
})

export default {
  data() {
    return Object.assign(
      {
        audio: null,
        authenticated: false,
        password: '',
        processing: false,
        submittingLogin: false,
      },
      formData()
    )
  },
  methods: {
    formReset() {
      const data = formData()
      for (const [key, value] of Object.entries(data)) {
        this[key] = data[key]
      }
      this.processing = false
      this.audio = null
    },
    formSubmit(event) {
      event.preventDefault()
      this.socket.emit(
        'warp-request',
        {
          url: this.url,
          shiftPitch: this.shiftPitch,
          stretchTempo: this.stretchTempo,
        },
        () => {
          this.processing = true
          this.audio = null
        }
      )
    },
    async loginSubmit(event) {
      event.preventDefault()
      this.submittingLogin = true
      let response
      try {
        response = await axios.post(window.appRoot + '/api/session', {
          pw: this.password,
        })
        this.authenticated = !!response.data.authenticated
      } catch (e) {
        this.authenticated = false
      }
      this.submittingLogin = false
    },
    socketSetup() {
      this.socket = io({ path: window.appRoot + '/socket.io' })
      this.socket.on('warp-error', (state) => {
        this.processing = false
        alert(
          'There was an error when trying to warp the link. Check the server console output.'
        )
      })
      this.socket.on('warp-complete', async (state) => {
        this.processing = false
        this.audio =
          window.appRoot +
          `/media/${btoa(state.url)}/warped_${state.shiftPitch}_${state.stretchTempo}.ogg`
        await nextTick()
        this.$refs.audio.focus()
      })
    },
  },
  async created() {
    window.appRoot = ''
    const response = await axios.get(window.appRoot + '/api/session')
    this.authenticated = !!response.data.authenticated
    if (!this.authenticated) {
      await nextTick()
      this.$refs.passwordInput.focus()
    }
  },
  watch: {
    async authenticated(authenticated) {
      if (authenticated) {
        this.socketSetup()
        await nextTick()
        this.$refs.urlInput.focus()
      }
    },
  },
}
</script>

<template>
  <div class="App">
    <form @submit="loginSubmit" v-if="!authenticated">
      <div class="form-group">
        <label for="password-input">Password</label>
        <input
          type="password"
          name="password"
          id="password-input"
          autocomplete="current-password"
          ref="passwordInput"
          v-model="password"
        />
      </div>
      <div class="form-group">
        <button type="submit" :disabled="submittingLogin">Login</button>
      </div>
    </form>
    <form @submit="formSubmit" v-if="authenticated">
      <div class="form-group">
        <label for="url-input">URL</label>
        <input type="url" v-model="url" id="url-input" ref="urlInput" />
      </div>
      <div class="form-group">
        <label for="shift-pitch-input">Shift Pitch</label>
        <input
          type="range"
          min="-12"
          max="12"
          v-model="shiftPitch"
          id="shift-pitch-input"
        />
        <input type="number" min="-12" max="12" v-model="shiftPitch" />
      </div>
      <div class="form-group">
        <label>Stretch Tempo</label>
        <input
          type="range"
          min="0.00"
          max="2.00"
          step="0.01"
          v-model="stretchTempo"
        />
        <input
          type="number"
          min="0.00"
          max="2.00"
          step="0.01"
          v-model="stretchTempo"
        />
      </div>
      <div class="form-group">
        <button type="button" @click="formReset">Clear</button>
        <button type="submit" :disabled="processing">Submit</button>
      </div>
    </form>
    <audio v-if="!!audio" controls autoplay ref="audio">
      <source :src="audio" type="audio/ogg" />
    </audio>
  </div>
</template>

<style scoped>
body {
  font-family: sans;
}
.App {
  padding: 1rem;
}
form {
  padding: 1rem;
  .form-group {
    margin-bottom: 1rem;
    label {
      font-family: sans;
      font-weight: bold;
      display: block;
      cursor: pointer;
    }
    input {
      width: 100%;
      padding: 0.25rem 0.5rem 0.25rem 0.5rem;
    }
    button {
      background-color: white;
      border: 1px solid black;
      padding: 0.5rem 1rem;
      &:first-child {
        margin-right: 0.5rem;
      }
    }
  }
  button {
    cursor: pointer;
  }
}
audio {
  width: 100%;
}
</style>
