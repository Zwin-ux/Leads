# Build Stage
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
COPY apps/client/package*.json ./apps/client/
COPY packages/shared/package*.json ./packages/shared/
RUN npm ci
COPY . .
RUN npm run build -w packages/shared
ARG VITE_DEMO_MODE=false
ARG VITE_BRAIN_SERVICE_URL
ARG VITE_API_URL
ARG VITE_GOOGLE_PLACES_API_KEY
ARG VITE_SOS_API_KEY
ARG VITE_HUNTER_API_KEY
ARG VITE_OPENAI_API_KEY

ENV VITE_DEMO_MODE=$VITE_DEMO_MODE
ENV VITE_BRAIN_SERVICE_URL=$VITE_BRAIN_SERVICE_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GOOGLE_PLACES_API_KEY=$VITE_GOOGLE_PLACES_API_KEY
ENV VITE_SOS_API_KEY=$VITE_SOS_API_KEY
ENV VITE_HUNTER_API_KEY=$VITE_HUNTER_API_KEY
ENV VITE_OPENAI_API_KEY=$VITE_OPENAI_API_KEY
RUN npm run build -w apps/client

# Serve Stage
FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/apps/client/dist ./dist
# Create a minimal package.json so 'npm start' works (Railway default)
# We use ${PORT:-3000} to let Railway set the port, defaulting to 3000
RUN echo '{"scripts": {"start": "serve -s dist -l tcp://0.0.0.0:${PORT:-3000}", "preview": "sh -c \"npm start\""}}' > package.json
EXPOSE 3000
CMD ["npm", "start"]
