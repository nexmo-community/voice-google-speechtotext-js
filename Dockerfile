FROM node:13.8.0-alpine3.10
ENV NODE_ENV production
WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN npm install --production --silent && mv node_modules ../
RUN apk add --no-cache python python-dev python3 python3-dev openssl-dev \
    linux-headers build-base bash git ca-certificates py-cryptography && \
    python3 -m ensurepip && \
    rm -r /usr/lib/python*/ensurepip && \
    pip3 install --upgrade pip setuptools && \
    if [ ! -e /usr/bin/pip ]; then ln -s pip3 /usr/bin/pip ; fi && \
    pip3 install --upgrade algoliasearch nexmo && \
    rm -r /root/.cache
COPY . .
EXPOSE 8000
CMD npm start