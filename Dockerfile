FROM node:24-alpine
WORKDIR /app
COPY functions ./functions
COPY public ./public
COPY src ./src
COPY package.json nas.mjs ./
RUN mkdir /data && chown node:node /data
USER node
ENV BIND=0.0.0.0 DATA_DIR=/data
CMD ["node","nas.mjs"]
