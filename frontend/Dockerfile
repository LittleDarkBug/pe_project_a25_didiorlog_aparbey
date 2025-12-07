FROM node:20

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Run Next.js dev server
CMD ["npm", "run", "dev"]
