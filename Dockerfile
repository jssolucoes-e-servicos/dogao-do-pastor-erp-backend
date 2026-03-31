FROM node:20.19-alpine

WORKDIR /app

COPY . .
RUN npm install
RUN npm run build && ls -la dist/

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:prod"]
