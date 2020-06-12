FROM php:7.4-fpm-alpine
COPY . /site/
WORKDIR /site
RUN apk add --no-cache composer && composer install --no-dev -o
