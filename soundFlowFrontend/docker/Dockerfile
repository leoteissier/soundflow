FROM node:19-alpine3.16

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .


RUN npm run build -n 

ARG BUILD_DATE
ARG BUILD_BRANCH
ARG BUILD_COMMIT
RUN echo "Build date : ${BUILD_DATE}" > /build.txt \
    && echo "Build branch : ${BUILD_BRANCH}" >> /build.txt \
    && echo "Build commit : ${BUILD_COMMIT}" >> /build.txt

EXPOSE 3000

ENV NUXT_HOST=0.0.0.0

ENV NUXT_PORT=3000

CMD ["npm", "start"]

