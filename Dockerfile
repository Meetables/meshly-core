FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache curl

RUN curl -L https://github.com/containrrr/shoutrrr/releases/latest/download/shoutrrr-alpine-amd64 \
    -o /usr/local/bin/shoutrrr && \
    chmod +x /usr/local/bin/shoutrrr

COPY package*.json ./
RUN npm install

COPY . .

ENV PORT=3000
EXPOSE 3000

CMD [ "npm", "start" ]