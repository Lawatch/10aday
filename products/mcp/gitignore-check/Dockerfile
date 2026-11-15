FROM node:22-alpine
LABEL io.modelcontextprotocol.server.name="io.github.Lawatch/gitignore-check"
LABEL org.opencontainers.image.source="https://github.com/Lawatch/10aday"
LABEL org.opencontainers.image.description="MCP server: is this path ignored by git, and by which .gitignore line? Exact git rules, no repository needed."
LABEL org.opencontainers.image.licenses="MIT"
WORKDIR /app
COPY server.js engine.js ./
USER node
ENTRYPOINT ["node", "/app/server.js"]
