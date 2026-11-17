FROM node:22-alpine
LABEL io.modelcontextprotocol.server.name="io.github.Lawatch/gha-trigger-check"
LABEL org.opencontainers.image.source="https://github.com/Lawatch/10aday"
LABEL org.opencontainers.image.description="MCP server: will this GitHub Actions workflow run for this push or pull request, and which line decides? Branch, tag and path filters, types, [skip ci]."
LABEL org.opencontainers.image.licenses="MIT"
WORKDIR /app
COPY server.js engine.js ./
COPY vendor/ ./vendor/
USER node
ENTRYPOINT ["node", "/app/server.js"]
