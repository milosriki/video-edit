# Use the official Node.js 22 image.
# https://hub.docker.com/_/node
FROM node:22-slim

# Create and change to the app directory.
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure both package.json AND package-lock.json are copied.
COPY package*.json ./

# Install dependencies (including devDependencies for build)
RUN npm install

# Copy local code to the container image.
COPY . .

# Build the TypeScript code
RUN npm run build

# Run the web service on container startup.
CMD [ "node", "dist/server.js" ]
