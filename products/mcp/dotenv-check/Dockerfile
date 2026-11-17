FROM node:22-alpine
LABEL io.modelcontextprotocol.server.name="io.github.Lawatch/dotenv-check"
LABEL org.opencontainers.image.source="https://github.com/Lawatch/10aday"
LABEL org.opencontainers.image.description="MCP server: what value each .env variable really gets, and which file and line decide, with dotenv, node --env-file, Vite and Next.js. Same code as the real loaders."
LABEL org.opencontainers.image.licenses="MIT"
WORKDIR /app
COPY server.js engine.js ./
COPY vendor/ ./vendor/
USER node
ENTRYPOINT ["node", "/app/server.js"]
