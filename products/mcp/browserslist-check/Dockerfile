FROM node:22-alpine
LABEL io.modelcontextprotocol.server.name="io.github.Lawatch/browserslist-check"
LABEL org.opencontainers.image.source="https://github.com/Lawatch/10aday"
LABEL org.opencontainers.image.description="MCP server: which browsers a browserslist query or config really targets (real browserslist + caniuse data), and whether a CSS/JS/HTML feature works in all of them."
LABEL org.opencontainers.image.licenses="MIT"
WORKDIR /app
COPY server.js browserslist.bundle.js ./
USER node
ENTRYPOINT ["node", "/app/server.js"]
