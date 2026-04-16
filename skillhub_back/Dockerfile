FROM php:8.2-cli-alpine

RUN apk add --no-cache \
    git \
    curl \
    bash \
    libzip-dev \
    sqlite-dev \
    oniguruma-dev \
    icu-dev \
    zlib-dev \
    openssl-dev \
    autoconf \
    gcc \
    g++ \
    make

RUN docker-php-ext-install pdo pdo_sqlite pdo_mysql bcmath zip intl
RUN pecl install mongodb && docker-php-ext-enable mongodb

RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

WORKDIR /var/www/html

COPY composer.json composer.lock ./
RUN composer install --no-dev --prefer-dist --no-progress --no-interaction --optimize-autoloader --no-scripts

COPY . .
RUN cp .env.example .env
RUN touch database/database.sqlite
RUN php artisan key:generate --ansi
RUN php artisan jwt:secret --force

EXPOSE 8000

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
