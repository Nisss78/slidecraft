# SlideCraft

Local AI-powered slide generation tool with MCP server integration.

Generate beautiful presentations from natural language prompts using Claude Code, with real-time browser preview and plugin extensibility.

## Features

- **AI Slide Generation** - Create full presentations from text prompts via MCP tools
- **Real-time Preview** - Live browser preview with WebSocket updates
- **Plugin System** - Extensible themes, layouts, elements, and exporters
- **Multiple Export Formats** - PDF, PPTX, PNG, HTML
- **Git-friendly** - JSON-based storage for version control

## Quick Start

```bash
# Install
pnpm install

# Build all packages
pnpm build

# Start the MCP server with preview
pnpm --filter @slidecraft/mcp-server dev
```

### Claude Code Integration

Add to your Claude Code MCP settings:

```json
{
  "mcpServers": {
    "slidecraft": {
      "command": "node",
      "args": ["path/to/slidecraft/packages/mcp-server/dist/index.js"]
    }
  }
}
```

Then use MCP tools:

```
create_deck(title: "My Presentation", theme: "minimal")
add_slide(deckId: "...", layout: "title", elements: [...])
preview(deckId: "...")
```

## Architecture

```
Claude Code ──stdio──► MCP Server ──WebSocket──► Browser Editor
                           │
                           ├── Plugin System
                           ├── JSON File Storage
                           └── HTTP API
```

## Packages

| Package | Description |
|---------|-------------|
| `@slidecraft/core` | Data models, validation, storage |
| `@slidecraft/mcp-server` | MCP server + HTTP/WS preview server |
| `@slidecraft/editor` | React browser UI |
| `@slidecraft/renderer` | Slide → HTML/CSS engine |
| `@slidecraft/export` | PDF/PPTX/PNG export |
| `@slidecraft/plugin-api` | Plugin interface definitions |

## Plugin Development

See [Plugin Development Guide](docs/plugin-development.md) for creating custom themes, layouts, and exporters.

## License

MIT
