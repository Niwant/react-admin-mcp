import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerSchemaAnalyzerTool } from './tools/analyzer/schemaAnalyzer.js';
import { registerUxDesignerTool } from './tools/designer/uxDesigner.js';
import { registerGeneratorTool } from './tools/developer/generator.js';

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
    registerSchemaAnalyzerTool(this.server);
    registerUxDesignerTool(this.server);
    registerGeneratorTool(this.server);
  }

  public async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("✅ Admin MCP Server running via stdio");
  }
} 