FROM node:18-alpine as dev

COPY ./ ./
RUN yarn --frozen-lockfile
RUN apk add git

FROM node:18-alpine as builder

COPY --from=dev /node_modules ./node_modules
COPY src src
COPY package.json yarn.lock tsconfig.json ./
RUN yarn run build

FROM node:18-alpine as prod

COPY package.json yarn.lock ./
COPY --from=builder /dist ./dist
RUN yarn --frozen-lockfile --production
RUN apk add git

ENV NODE_ENV=production

CMD [ "yarn", "run", "start:noBuild" ]