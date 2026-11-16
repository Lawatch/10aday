FROM node:22-alpine
LABEL io.modelcontextprotocol.server.name="io.github.Lawatch/editorconfig-check"
LABEL org.opencontainers.image.source="https://github.com/Lawatch/10aday"
LABEL org.opencontainers.image.description="MCP server: which EditorConfig settings apply to a file (indent, line endings, charset, final newline) and which .editorconfig section and line decide. Exact reference rules."
LABEL org.opencontainers.image.licenses="MIT"
WORKDIR /app
COPY server.js engine.js ./
USER node
ENTRYPOINT ["node", "/app/server.js"]
