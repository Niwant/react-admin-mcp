import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GetObjectsParams } from '../../../types/index.js';
import { getDatabase } from '../../../config/database.js';

export function registerQueryTool(server: McpServer) {
  server.tool(
    "getObjects",
    `Retrieves multiple documents from a specified MongoDB collection.`,
    GetObjectsParams.shape,
    async ({ collection, filter = {} }) => {
      const db = await getDatabase();
      let documents = [];

      try {
        documents = await db.collection(collection).find(filter).limit(100).toArray();
      } catch (err) {
        console.error("❌ Error fetching documents:", err);
        return {
          content: [{ type: "text", text: "❌ Failed to fetch documents." }],
        };
      }

      if (!documents.length) {
        return {
          content: [{ type: "text", text: `⚠️ No documents found in ${collection}` }],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `📄 Fetched ${documents.length} documents from "${collection}":\n\n` +
                  JSON.stringify(documents, null, 2),
          },
        ],
      };
    }
  );
} 