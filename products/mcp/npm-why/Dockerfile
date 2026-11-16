FROM node:22-alpine
LABEL io.modelcontextprotocol.server.name="io.github.Lawatch/npm-why"
LABEL org.opencontainers.image.source="https://github.com/Lawatch/10aday"
LABEL org.opencontainers.image.description="MCP server: why is a package in node_modules, which versions, and who pulls it in. Same tree as npm explain, read from package-lock.json. Plus packages installed in several versions."
LABEL org.opencontainers.image.licenses="MIT"
WORKDIR /app
COPY server.js engine.js depvalid.js ./
USER node
ENTRYPOINT ["node", "/app/server.js"]
