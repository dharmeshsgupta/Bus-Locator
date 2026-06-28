# Stage 1: Build the React App
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG VITE_AUTH_API_URL
ARG VITE_TRANSPORT_API_URL
ARG VITE_TRACKING_API_URL
ENV VITE_AUTH_API_URL=$VITE_AUTH_API_URL
ENV VITE_TRANSPORT_API_URL=$VITE_TRANSPORT_API_URL
ENV VITE_TRACKING_API_URL=$VITE_TRACKING_API_URL
RUN npm run build

# Stage 2: Serve the Built React SPA with Nginx
FROM nginx:1.25-alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Custom Nginx config to support React Router HTML5 History API fallback routing
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
