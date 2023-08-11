FROM node:slim

# Create app directory
WORKDIR /usr/src/app
COPY ./nemorastur/ .

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)

RUN npm install
# If you are building your code for production
# RUN npm ci --omit=dev

# Bundle app source

EXPOSE 3000
CMD [ "npm", "run", "start" ]