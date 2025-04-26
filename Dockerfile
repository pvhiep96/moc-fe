FROM node:19-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY yarn.lock ./
RUN yarn install

# Copy source code
COPY . .

# Build the app
RUN yarn build

# Expose port
EXPOSE 3000

# Start the app
CMD ["yarn", "start"]