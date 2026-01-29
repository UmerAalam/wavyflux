FROM node:20-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json tsconfig.json ./
RUN npm install --production && npm install --save-dev typescript

COPY server.ts ./
RUN npm run build

CMD ["npm", "start"]
