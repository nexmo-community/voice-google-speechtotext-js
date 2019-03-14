FROM node:11-alpine

EXPOSE 8000 8001
WORKDIR /usr/src/

COPY ./package.json ./
RUN npm install

ENV PATH /usr/src/node_modules/.bin:$PATH

COPY . .

CMD ["npm", "start"]