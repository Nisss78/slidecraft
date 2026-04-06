# Getting Started with Slide Harness

## Installation

```bash
git clone https://github.com/Nisss78/slidecraft.git
cd slidecraft
pnpm install
pnpm build
```

## Setup with Claude Code

Add to your MCP settings (`~/.claude/claude_desktop_config.json` or similar):

```json
{
  "mcpServers": {
    "slideharness": {
      "command": "node",
      "args": ["/path/to/slideharness/packages/mcp-server/dist/index.js"]
    }
  }
}
```

## Creating Your First Deck

1. **Create a deck:**
   ```
   create_deck(title: "My First Presentation", theme: "minimal")
   ```

2. **Add a title slide:**
   ```
   add_slide(deckId: "xxx", elements: [
     { type: "text", content: "Hello World", position: { x: 10, y: 30, width: 80, height: 20 }, style: { fontSize: 56, fontWeight: "bold", textAlign: "center" } },
     { type: "text", content: "My first Slide Harness presentation", position: { x: 15, y: 55, width: 70, height: 10 }, style: { fontSize: 24, textAlign: "center", color: "#666" } }
   ])
   ```

3. **Preview in browser:**
   ```
   preview(deckId: "xxx")
   ```
   Opens `http://localhost:4983/preview/xxx` with live WebSocket updates.

4. **Add more slides, then export:**
   ```
   export_deck(deckId: "xxx", format: "pdf", outputPath: "./presentation.pdf")
   ```

## Element Types

| Type | Key Properties |
|------|---------------|
| `text` | content, style (fontSize, fontWeight, textAlign, color) |
| `image` | src, objectFit, borderRadius |
| `shape` | shape (rectangle, circle, triangle, arrow, line, star), fill, stroke |
| `chart` | chartType (bar, line, pie), data (labels, datasets) |
| `table` | headers, rows, striped |
| `code` | code, language, showLineNumbers |

All positions use percentage-based coordinates (0-100) for x, y, width, height.

## Themes

- `minimal` - Clean white with blue accents
- `corporate` - Professional business style
- `dark` - Modern dark theme for tech talks

## Templates

- `pitch-deck` - 10-slide startup pitch
- `tech-talk` - Technical presentation
- `weekly-report` - Status report
