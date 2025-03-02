FROM docker.io/library/alpine:3.21

RUN apk update
RUN apk add bash nodejs npm yt-dlp rubberband

RUN mkdir /warp
RUN mkdir /warp/media
ADD dist /warp/dist
ADD index.html /warp/
ADD LICENSE /warp/
ADD public /warp/public
ADD scripts /warp/scripts
ADD package.json /warp/
ADD server.js /warp/
ADD warp.sh /warp/

WORKDIR /warp
ENV NODE_ENV=production
RUN npm install

EXPOSE 8712

ADD .pw ./

CMD ["node", "server.js"]
