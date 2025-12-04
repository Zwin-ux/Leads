# Build Stage
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
COPY apps/client/package*.json ./apps/client/
COPY packages/shared/package*.json ./packages/shared/
RUN npm ci
COPY . .
RUN npm run build -w packages/shared
RUN npm run build -w apps/client

# Serve Stage
FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/apps/client/dist ./dist
# Create a minimal package.json so 'npm start' works (Railway default)
# We use ${PORT:-3000} to let Railway set the port, defaulting to 3000
RUN echo '{"scripts": {"start": "serve -s dist -l tcp://0.0.0.0:${PORT:-3000}"}}' > package.json
EXPOSE 3000
CMD ["npm", "start"]
