FROM node AS node-build
COPY ./package.* ./*.js ./*.mjs ./tsconfig.json /build/
COPY ./assets /build/assets/
COPY ./src /build/src/
WORKDIR /build
RUN npm i \
    && npx rollup -c rollup.config.mjs


FROM composer AS composer
COPY ./composer.* /build/
WORKDIR /build
RUN composer install \
  --optimize-autoloader \
  --ignore-platform-reqs \
  --no-interaction \
  --no-progress

FROM php:7.4-fpm-alpine

USER root
RUN apk -U upgrade
USER nobody

COPY --chown=nobody ./src /site/src/
COPY --chown=nobody ./conf /site/conf/
COPY --chown=nobody ./public /site/public/
COPY --chown=nobody --from=node-build /build/resources /site/resources/
COPY --chown=nobody --from=composer /build/vendor /site/vendor/
