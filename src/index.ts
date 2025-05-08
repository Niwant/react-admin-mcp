import "dotenv/config";
import { MCPServer } from './lib/mcp/server.js';

async function main() {
  try {
    const server = new MCPServer();
    await server.start();
  } catch (error) {
    console.error("❌ Fatal error in MCP server:", error);
    process.exit(1);
  }
}
main()