import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GetSchemasParams } from '../../../types/index.js';
import { getDatabase } from '../../../config/database.js';

export function registerSchemaTool(server: McpServer) {
  server.tool(
    "getSchemas",
    "Fetch all MongoDB collection schemas",
    GetSchemasParams.shape,
    async () => {
      const db = await getDatabase();
      const collections = await db.listCollections().toArray();
      
      const schemaInfo = [];
      for (const coll of collections) {
        try {
          const sample = await db.collection(coll.name).findOne();
          if (sample) {
            schemaInfo.push({
              name: coll.name,
              fields: Object.fromEntries(
                Object.entries(sample).map(([k, v]) => [k, typeof v])
              ),
            });
          }
        } catch (err) {
          console.error(`Skipping ${coll.name} due to read error:`, err);
        }
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(schemaInfo, null, 2),
          },
        ],
      };
    }
  );
} 