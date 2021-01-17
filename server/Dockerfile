FROM node:14

WORKDIR /server

COPY package*.json cert.pem key.pem ./
RUN npm ci

COPY *.js  *.json *.ts ./
COPY src src

CMD npm start
