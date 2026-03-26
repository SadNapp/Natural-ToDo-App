# Install dependencies and build the app
FROM node:20-alpine AS build
WORKDIR /app

# Copy configuration and install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the code
COPY . .

# Argument to allow overriding the API URL during build process
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL:-http://localhost:5186/api/todo}

# Build the React application using Vite
RUN npm run build

# Serve the static files with Nginx
FROM nginx:alpine AS runtime

# Copy build output to Nginx's HTML folder
COPY --from=build /app/dist /usr/share/nginx/html

# Replace default Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
