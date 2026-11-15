FROM node:22-alpine
LABEL io.modelcontextprotocol.server.name="io.github.Lawatch/dockerignore-check"
LABEL org.opencontainers.image.source="https://github.com/Lawatch/10aday"
LABEL org.opencontainers.image.description="MCP server: which files does docker build really send, and which .dockerignore line decides? Exact Docker (BuildKit) rules."
LABEL org.opencontainers.image.licenses="MIT"
WORKDIR /app
COPY server.js engine.js ./
USER node
ENTRYPOINT ["node", "/app/server.js"]
