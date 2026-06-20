# 멀티스테이지: React 빌드 → nginx 정적 서빙 + /api 프록시
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
# nginx:alpine은 /etc/nginx/templates/*.template 를 envsubst로 처리합니다.
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
