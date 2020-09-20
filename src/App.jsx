import axios from 'axios'
import React from 'react'
import ReactPlayer from 'react-player'
import io from 'socket.io-client'
import { Boilerplate, Spinner } from '@preaction/bootstrap-clips'
import { Input, Form } from '@preaction/inputs/dist/preaction-inputs.cjs.js'
import { urlValidator } from '@preaction/validation'
import 'bootstrap/dist/css/bootstrap.min.css'
import './App.css'

class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      audio: '',
      authenticated: undefined,
      loginFormPw: '',
      processing: false,
      shiftPitch: 0,
      stretchTempo: 1.0,
      url: '',
    }
  }

  componentDidMount() {
    axios.get(window.appRoot + '/api/session').then((response) => {
      const authenticated = !!response.data.authenticated
      this.setState({ authenticated })
    })
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.authenticated && !prevState.authenticated) {
      this.socket = io({ path: window.appRoot + '/socket.io' })
      this.socket.on('warp-complete', (state) => {
        this.setState({
          processing: false,
          audio:
            window.appRoot +
            `/media/${btoa(state.url)}/warped_${state.shiftPitch}_${
              state.stretchTempo
            }.ogg`,
          url: state.url,
          shiftPitch: state.shiftPitch,
          stretchTempo: state.stretchTempo,
        })
      })
      this.socket.on('warp-error', (state) => {
        this.setState({
          processing: false,
          audio: '',
          url: state.url,
          shiftPitch: state.shiftPitch,
          stretchTempo: state.stretchTempo,
        })
        alert(
          'There was an error when trying to warp the link. Check the server console output.'
        )
      })
    }
  }

  getValueHandler = (key) => {
    return (value) => {
      this.setState((state) => {
        state[key] = value
        return state
      })
    }
  }

  submit(event) {
    event.preventDefault()
    if (this.state.url && !urlValidator(this.state.url)) {
      this.socket.emit('warp-request', this.state, () => {
        this.setState({ processing: true })
      })
    }
  }

  render() {
    return (
      <div className='App'>
        {this.state.authenticated === undefined ? (
          <div
            style={{
              width: '10rem',
              marginLeft: 'auto',
              marginRight: 'auto',
              marginTop: '2rem',
            }}
          >
            <Spinner type='grow' size='10' />
          </div>
        ) : (
          ''
        )}
        {this.state.authenticated === true ? (
          <Boilerplate
            jumbotron={
              <div>
                <h1 className='mb-3'>Warp Audio Server</h1>
                <Input
                  type='url'
                  placeholder='URL'
                  required
                  value={this.state.url}
                  valueHandler={this.getValueHandler('url')}
                />
                <button
                  type='button'
                  className='btn btn-lg btn-primary mb-3'
                  onClick={async () => {
                    this.setState({ url: '' })
                  }}
                >
                  Clear
                </button>
              </div>
            }
          >
            <Input
              label='Shift Pitch'
              type='number'
              min='-12'
              max='12'
              value={this.state.shiftPitch}
              valueHandler={this.getValueHandler('shiftPitch')}
            />
            <Input
              type='range'
              min='-12'
              max='12'
              value={this.state.shiftPitch}
              valueHandler={this.getValueHandler('shiftPitch')}
            />
            <Input
              type='number'
              label='Stretch Tempo'
              min='0.00'
              max='2.00'
              step='0.01'
              value={this.state.stretchTempo}
              valueHandler={this.getValueHandler('stretchTempo')}
            />
            <Input
              type='range'
              min='0.00'
              max='2.00'
              step='0.01'
              value={this.state.stretchTempo}
              valueHandler={this.getValueHandler('stretchTempo')}
            />
            <hr />
            <div className='btn-group mb-3'>
              <button
                className='btn btn-success btn-lg'
                disabled={this.state.processing}
                onClick={this.submit.bind(this)}
              >
                Warp
              </button>
            </div>
            {this.state.audio ? (
              <ReactPlayer
                url={this.state.audio}
                controls
                width='100%'
                height='3em'
                playing
              />
            ) : (
              ''
            )}
          </Boilerplate>
        ) : (
          ''
        )}
        {this.state.authenticated === false ? (
          <Boilerplate
            jumbotron={<h1 className='display-4'>Warp Audio Server Login</h1>}
          >
            <div className='row'>
              <div className='col-lg-6 ml-auto mr-auto'>
                <Form
                  noValidate
                  onSubmit={(e) => {
                    e.preventDefault()
                    axios
                      .post(window.appRoot + '/api/session', {
                        pw: this.state.loginFormPw,
                      })
                      .then((response) => {
                        const authenticated = !!response.data.authenticated
                        this.setState({ authenticated })
                      })
                  }}
                >
                  <Input
                    name='password'
                    label='Password'
                    type='password'
                    required
                    value={this.state.loginFormPw}
                    valueHandler={(value) => {
                      this.setState({ loginFormPw: value })
                    }}
                  />
                  <button type='submit' className='btn btn-primary'>
                    Login
                  </button>
                </Form>
              </div>
            </div>
          </Boilerplate>
        ) : (
          ''
        )}
      </div>
    )
  }
}

export default App
