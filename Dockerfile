FROM node:20-alpine

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies across root, client, and server workspaces
RUN npm run install:all

# Copy all repository source code
COPY . .

# Build client bundle, run Prisma migrations, and seed initial data
RUN npm run build

ENV NODE_ENV=production
ENV PORT=5001

EXPOSE 5001

CMD ["npm", "start"]
