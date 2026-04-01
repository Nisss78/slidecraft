#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { JsonFileStorage } from '@slidecraft/core';
import { PluginRegistry } from '@slidecraft/plugin-api';
import { PreviewServer } from './preview-server.js';
import { registerTools } from './tools.js';
import { defaultThemes } from './default-themes.js';
import { defaultLayouts } from './default-layouts.js';

async function main() {
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

  // Initialize preview server (v2: uses storage directly)
  const previewServer = new PreviewServer({
    storage,
  });

  // Start preview server immediately
  const port = await previewServer.start();
  console.error(`[SlideCraft] Preview server started on http://localhost:${port}`);

  // Initialize MCP server
  const mcpServer = new McpServer({
    name: 'slidecraft',
    version: '2.0.0',
  });

  // Register all tools
  registerTools(mcpServer, storage, registry, previewServer);

  // Connect via stdio
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
  console.error('[SlideCraft] MCP server connected via stdio (v2 HTML-first)');
}

main().catch((err) => {
  console.error('[SlideCraft] Fatal error:', err);
  process.exit(1);
});
