FROM node:20

WORKDIR /app

RUN rm -rf node_modules

RUN npm cache clean --force

RUN npm install -g npm@latest


# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Build Next.js app
RUN npm run build

# Expose port
EXPOSE 3000

# Run Next.js production server
CMD ["npm", "start"]
