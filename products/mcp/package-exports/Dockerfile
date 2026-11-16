FROM node:22-alpine
LABEL io.modelcontextprotocol.server.name="io.github.Lawatch/package-exports"
LABEL org.opencontainers.image.source="https://github.com/Lawatch/10aday"
LABEL org.opencontainers.image.description="MCP server: which file Node loads for import or require of a package subpath, and why. Same rules as Node 22 for package.json exports, imports and main; lints exports maps."
LABEL org.opencontainers.image.licenses="MIT"
WORKDIR /app
COPY server.js engine.js ./
USER node
ENTRYPOINT ["node", "/app/server.js"]
