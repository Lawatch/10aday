FROM node:22-alpine
LABEL io.modelcontextprotocol.server.name="io.github.Lawatch/version-range-mcp"
LABEL org.opencontainers.image.source="https://github.com/Lawatch/10aday"
LABEL org.opencontainers.image.description="MCP server: which versions a dependency constraint accepts, per package manager (npm, Cargo, Composer, pip, RubyGems, Maven, Gradle, NuGet)."
LABEL org.opencontainers.image.licenses="MIT"
WORKDIR /app
COPY server.js ./
COPY engines ./engines
USER node
ENTRYPOINT ["node", "/app/server.js"]
