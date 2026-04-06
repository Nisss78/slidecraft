# Contributing to Slide Harness

## Development Setup

```bash
git clone https://github.com/Nisss78/slidecraft.git
cd slidecraft
pnpm install
pnpm build
```

## Project Structure

```
packages/
  core/         - Data models, validation, storage
  plugin-api/   - Plugin interface definitions
  renderer/     - HTML/CSS rendering engine
  mcp-server/   - MCP server + HTTP/WS server
  editor/       - React browser UI
  export/       - PDF/PPTX/PNG export
plugins/        - Official plugins (themes, layouts)
templates/      - Built-in templates
```

## Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes and add tests
4. Run `pnpm build && pnpm test`
5. Submit a pull request

## Code Style

- TypeScript strict mode
- Prettier for formatting (`pnpm format`)
- ESM modules (`.js` extensions in imports)

## Adding a New Plugin

1. Create directory in `plugins/`
2. Follow the plugin API (see `docs/plugin-development.md`)
3. Add to `pnpm-workspace.yaml` if needed

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
