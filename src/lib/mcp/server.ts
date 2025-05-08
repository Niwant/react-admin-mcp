import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerSchemaTool } from './tools/schemas.js';
import { registerGenerateTool } from './tools/generate.js';
import { registerUpdateTool } from './tools/update.js';
import { registerQueryTool } from './tools/query.js';

export class MCPServer {
  private server: McpServer;

  constructor() {
    this.server = new McpServer({
      name: "admin-mcp",
      version: "1.0.0",
      capabilities: {
        tools: {},
        resources: {},
      },
    });

    this.registerTools();
  }

  private registerTools() {
    registerSchemaTool(this.server);
    registerGenerateTool(this.server);
    registerUpdateTool(this.server);
    registerQueryTool(this.server);
  }

  public async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("✅ Admin MCP Server running via stdio");
  }
} 