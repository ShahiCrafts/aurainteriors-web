FROM node:25-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY src ./src
COPY public ./public
COPY index.html index.admin.html vite.config.js ./
ARG VITE_API_BASE_URL
ARG VITE_API_URL
ARG APP_MODE=customer
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL VITE_API_URL=$VITE_API_URL
RUN case "$APP_MODE" in customer|admin) ;; *) exit 1 ;; esac && npm run "build:$APP_MODE" && cp -R "dist/$APP_MODE" /app/site

FROM nginxinc/nginx-unprivileged:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/site /usr/share/nginx/html
USER 101
EXPOSE 8080
