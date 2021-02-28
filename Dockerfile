# https://hub.docker.com/_/node
FROM node:lts

WORKDIR /usr/src/app

# RUN ls -l
COPY package*.json ./

ENV NODE_ENV=production
ARG MQTT_USER
ARG MQTT_HOST
ARG MQTT_PORT
ARG MQTT_PASSWORD

env MQTT_USER=$MQTT_USER
env MQTT_HOST=$MQTT_HOST
env MQTT_PORT=$MQTT_PORT
env MQTT_PASSWORD=$MQTT_PASSWORD
# COPY .env ./.env

# Install production dependencies.
# RUN npm install --only=production

# Copy local code to the container image.
# COPY . /usr/src/app
RUN yarn install --production

# RUN ./build.sh react-app
# COPY build.sh ./
# RUN pwd

# COPY dist /usr/src/app/dist
COPY ./server*.js ./

# Run the web service on container startup.
CMD [ "node", "server.js" ]