FROM node:22-alpine
LABEL io.modelcontextprotocol.server.name="io.github.Lawatch/npm-pack-check"
LABEL org.opencontainers.image.source="https://github.com/Lawatch/10aday"
LABEL org.opencontainers.image.description="MCP server: which files npm publish really ships (files, .npmignore, .gitignore, npm built-in rules), which rule decides each one, and the leaks to fix before publishing. Exact npm 10 rules."
LABEL org.opencontainers.image.licenses="MIT"
WORKDIR /app
COPY server.js engine.js minimatch.js ./
USER node
ENTRYPOINT ["node", "/app/server.js"]
