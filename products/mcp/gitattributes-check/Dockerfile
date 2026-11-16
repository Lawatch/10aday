FROM node:22-alpine
LABEL io.modelcontextprotocol.server.name="io.github.Lawatch/gitattributes-check"
LABEL org.opencontainers.image.source="https://github.com/Lawatch/10aday"
LABEL org.opencontainers.image.description="MCP server: which git attributes apply to a path (line endings, binary, LFS, export-ignore, linguist) and which .gitattributes line decides. Exact git rules."
LABEL org.opencontainers.image.licenses="MIT"
WORKDIR /app
COPY server.js engine.js ./
USER node
ENTRYPOINT ["node", "/app/server.js"]
