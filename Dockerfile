FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build && npm run build:single
FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-single/index.html ./dist/wetterinsel.html
COPY server.mjs ./
ENV PORT=80 DATA_DIR=/data DIST_DIR=/app/dist
VOLUME /data
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q -O /dev/null http://127.0.0.1/api/status || exit 1
CMD ["node", "server.mjs"]
