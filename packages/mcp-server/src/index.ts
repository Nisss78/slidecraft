import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { JsonFileStorage } from '@slideharness/core';
import { PluginRegistry } from '@slideharness/plugin-api';
import { PreviewServer } from './preview-server.js';
import { registerTools } from './tools.js';
import { defaultThemes } from './default-themes.js';
import { defaultLayouts } from './default-layouts.js';

async function main() {
  const noPreview = process.env.SLIDEHARNESS_NO_PREVIEW === '1'
    || process.argv.includes('--no-preview');

  // Initialize storage (v2: directory-based)
  const storage = new JsonFileStorage();

  // Initialize plugin registry with defaults
  const registry = new PluginRegistry();
  for (const theme of defaultThemes) {
    registry.registerTheme(theme);
  }
  for (const layout of defaultLayouts) {
    registry.registerLayout(layout);
  }

  // Initialize preview server (skip with --no-preview or SLIDEHARNESS_NO_PREVIEW=1)
  let previewServer: PreviewServer | null = null;
  if (!noPreview) {
    previewServer = new PreviewServer({ storage });
    const port = await previewServer.start();
    console.error(`[Slide Harness] Preview server started on http://localhost:${port}`);
  } else {
    console.error('[Slide Harness] Preview server disabled (--no-preview)');
  }

  // Initialize MCP server
  const mcpServer = new McpServer({
    name: 'slideharness',
    version: '2.0.0',
  });

  // Register all tools
  registerTools(mcpServer, storage, registry, previewServer);

  // Connect via stdio
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
  console.error('[Slide Harness] MCP server connected via stdio (v2 HTML-first)');

  // Graceful shutdown
  const shutdown = () => {
    console.error('[Slide Harness] Shutting down...');
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('[Slide Harness] Fatal error:', err);
  process.exit(1);
});
