FROM node:18-alpine

WORKDIR /app

# Copy dependency definitions
COPY package.json ./

# Install dependencies
RUN npm install

# Copy all files
COPY . .

# Expose the port the app runs on
EXPOSE 3001

# Command to run the application
CMD ["npm", "start"]
