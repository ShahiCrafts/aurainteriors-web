FROM node:25-alpine@sha256:bdf2cca6fe3dabd014ea60163eca3f0f7015fbd5c7ee1b0e9ccb4ced6eb02ef4 AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY vendor ./vendor
RUN npm ci --ignore-scripts
COPY src ./src
COPY public ./public
COPY index.html index.admin.html vite.config.js ./
ARG VITE_API_BASE_URL
ARG VITE_API_URL
ARG APP_MODE=customer
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL VITE_API_URL=$VITE_API_URL
RUN case "$APP_MODE" in customer|admin) ;; *) exit 1 ;; esac && npm run "build:$APP_MODE" && cp -R "dist/$APP_MODE" /app/site

FROM nginxinc/nginx-unprivileged:alpine@sha256:b5047b9b76845eac124358373c6852377c52e4b05834a47647e955dd91cb8f1e
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/site /usr/share/nginx/html
USER 101
EXPOSE 8080
