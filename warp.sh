#!/bin/env bash

b64=$(echo -n "$1" | base64)
mkdir -p media/$b64
cd media/$b64

if test -s src.wav; then
  echo 'skipping download'
else
  echo 'downloading'
  yt-dlp -x -f 251 "$1" -o "src" || exit 2
  echo 'converting'
  ffmpeg -i src.opus src.wav || exit 2
fi
if test -s warped_$2_$3.ogg; then
  echo 'skipping warp'
else
  echo 'warping'
  rubberband -p$2 -T$3 -F src.wav warped_$2_$3.wav || exit 2
  echo 'converting'
  ffmpeg -i warped_$2_$3.wav warped_$2_$3.ogg || exit 2
fi
echo warped_$2_$3.ogg
