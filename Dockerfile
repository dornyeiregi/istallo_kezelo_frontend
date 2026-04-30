FROM node:22-alpine AS build

WORKDIR /app

ARG NG_BUILD_CONFIG=production

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration=${NG_BUILD_CONFIG}

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/istallo_kezelo_frontend/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
