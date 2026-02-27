# Stage 1: Build the React application
FROM node:18-alpine AS build

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build (we pass VITE_API_URL as / so Nginx proxies it without duplicating /api)
COPY . .
ENV VITE_API_URL=/
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy build output to Nginx html directory
COPY --from=build /app/dist /usr/share/nginx/html

# Replace default Nginx config with our custom proxy setup
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
