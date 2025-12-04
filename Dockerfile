# Build Stage
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
COPY apps/client/package*.json ./apps/client/
COPY packages/shared/package*.json ./packages/shared/
RUN npm ci
COPY . .
RUN npm run build -w apps/client

# Serve Stage
FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/apps/client/dist ./dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
