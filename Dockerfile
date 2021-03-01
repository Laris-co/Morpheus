# https://hub.docker.com/_/node
FROM node:lts

WORKDIR /usr/src/app

# RUN ls -l
COPY package*.json ./

ENV NODE_ENV=production

ARG BASIC_AUTH_USERNAME
ARG BASIC_AUTH_PASSWORD

env BASIC_AUTH_USERNAME=$BASIC_AUTH_USERNAME
env BASIC_AUTH_PASSWORD=$BASIC_AUTH_PASSWORD

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