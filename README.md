## Warp Audio Server

This is a simple web application that takes a YouTube URL, and warps the audio according to user parameters.

It is meant to help musicians experiment with key and tempo changes.

![Screenshot](./screenshot.png)

### Dependencies

The following commands must be installed and available within your PATH environment:

- node and npm (both part of [NodeJS](https://nodejs.org/))
- bash
- [youtube-dl](https://github.com/ytdl-org/youtube-dl)
- [ffmpeg](https://ffmpeg.org/)
- [rubberband](https://github.com/breakfastquay/rubberband)
- mkdir and base64 (both part of GNU coreutils)

### Installation

```
git clone https://github.com/duhdugg/warp-audio-server.git
cd warp-audio-server
npm install
npm run build
```

### Running

`npm start`

Now visit `http://localhost:8712` in your web browser. You can also use a second device by entering `http://a.b.c.d:8712` into the browser where `a.b.c.d` is the network IP address of the machine running the server.

You can run it on a different port with the following:

`PORT=9000 npm start`

### Security

As of right now, this should only be ran on private networks. There is no authentication mechanism, so anyone who can access the listening port will be able to send warp requests.
